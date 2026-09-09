import asyncio
import datetime
import json
import os
import sys
import uuid
import aiohttp
from dotenv import load_dotenv

# Load root .env file if present
load_dotenv()

from livekit import agents, rtc
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, inference, stt
from livekit.plugins import deepgram

def get_stt_instance(session: aiohttp.ClientSession):
    """
    Initializes LiveKit Inference realtime STT with an explicit aiohttp session.
    Preferred model: google/gemini-3.5-transcribe-live
    Fallback: deepgram/nova-3, or auto inference.
    """
    try:
        print("[MeetFlow STT] Initializing LiveKit Inference STT (google/gemini-3.5-transcribe-live)...", flush=True)
        return inference.STT(model="google/gemini-3.5-transcribe-live", http_session=session)
    except Exception as e:
        print(f"[MeetFlow STT] LiveKit Inference google/gemini-3.5-transcribe-live note: {e}", flush=True)

    try:
        print("[MeetFlow STT] Trying LiveKit Inference Deepgram (deepgram/nova-3)...", flush=True)
        return inference.STT(model="deepgram/nova-3", http_session=session)
    except Exception as e:
        print(f"[MeetFlow STT] LiveKit Inference Deepgram note: {e}", flush=True)

    try:
        print("[MeetFlow STT] Trying LiveKit Inference auto...", flush=True)
        return inference.STT(model="auto", http_session=session)
    except Exception as e:
        print(f"[MeetFlow STT] LiveKit Inference auto note: {e}", flush=True)

    if os.getenv("DEEPGRAM_API_KEY"):
        return deepgram.STT(model="nova-3", http_session=session)

    raise RuntimeError("No streaming STT provider could be initialized.")


async def entrypoint(ctx: JobContext):
    print(f"[MeetFlow STT] agent configured=true")
    print(f"[MeetFlow STT] agent connected=true")
    print(f"[MeetFlow STT] room={ctx.room.name}")
    print(f"[MeetFlow STT] provider=LiveKit Inference (google/gemini-3.5-transcribe)")

    # Connect to the room and auto-subscribe to participant audio
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    my_identity = ctx.room.local_participant.identity
    print(f"[MeetFlow STT] Joined room {ctx.room.name} as {my_identity}")

    # Broadcast agent ready event so frontend can immediately confirm STT is live
    ready_payload = json.dumps({
        "type": "stt-agent-ready",
        "agentName": "meetflow-stt",
        "room": ctx.room.name,
        "status": "live",
        "model": "google/gemini-3.5-transcribe"
    })
    try:
        await ctx.room.local_participant.publish_data(ready_payload, topic="lk.transcription", reliable=True)
    except Exception as e:
        print(f"[MeetFlow STT] Agent ready broadcast warning: {e}")

    shutdown_event = asyncio.Event()

    @ctx.room.on("disconnected")
    def on_disconnected():
        print(f"[MeetFlow STT] Room {ctx.room.name} disconnected, ending agent.")
        shutdown_event.set()

    async def on_shutdown():
        print(f"[MeetFlow STT] Shutdown requested for room {ctx.room.name}")
        shutdown_event.set()

    ctx.add_shutdown_callback(on_shutdown)

    async with aiohttp.ClientSession() as session:
        stt_instance = get_stt_instance(session)
        active_tasks: dict[str, tuple[asyncio.Task, asyncio.Task]] = {}

        async def transcribe_track(track: rtc.Track, publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
            track_sid = track.sid
            speaker_name = participant.name or participant.identity or "Participant"
            print(f"[MeetFlow STT] Subscribing to audio track {track_sid} of participant {participant.identity} ({speaker_name})")

            audio_stream = rtc.AudioStream(track, sample_rate=16000)
            stt_stream = stt_instance.stream()

            async def forward_audio():
                try:
                    async for frame_event in audio_stream:
                        stt_stream.push_frame(frame_event.frame)
                except asyncio.CancelledError:
                    pass
                except Exception as err:
                    print(f"[MeetFlow STT] forward_audio error for {speaker_name}: {err}")
                finally:
                    stt_stream.end_input()

            async def read_transcripts():
                try:
                    async for ev in stt_stream:
                        if not ev.alternatives or not ev.alternatives[0].text:
                            continue

                        text = ev.alternatives[0].text.strip()
                        if not text:
                            continue

                        is_final = (ev.type == stt.SpeechEventType.FINAL_TRANSCRIPT)
                        seg_id = f"stt-{int(datetime.datetime.now().timestamp() * 1000)}-{uuid.uuid4().hex[:6]}"
                        now_iso = datetime.datetime.now().isoformat()

                        # 1. Native LiveKit room transcription event
                        try:
                            seg = rtc.TranscriptionSegment(
                                id=seg_id,
                                text=text,
                                start_time=int(datetime.datetime.now().timestamp() * 1000),
                                end_time=int(datetime.datetime.now().timestamp() * 1000),
                                language="en",
                                final=is_final
                            )
                            await ctx.room.local_participant.publish_transcription(
                                rtc.Transcription(
                                    participant_identity=participant.identity,
                                    track_sid=track.sid,
                                    segments=[seg]
                                )
                            )
                        except Exception:
                            pass

                        # 2. Streaming text topic 'lk.transcription'
                        try:
                            data_payload = json.dumps({
                                "type": "lk.transcription",
                                "id": seg_id,
                                "participantIdentity": participant.identity,
                                "participantName": speaker_name,
                                "speaker": speaker_name,
                                "text": text,
                                "final": is_final,
                                "isFinal": is_final,
                                "timestamp": now_iso
                            })
                            await ctx.room.local_participant.publish_data(
                                data_payload,
                                topic="lk.transcription",
                                reliable=is_final
                            )
                        except Exception as err:
                            print(f"[MeetFlow STT] publish_data error: {err}")

                        if is_final:
                            print(f"[MeetFlow STT] final transcript received speaker={speaker_name} text=\"{text}\"")
                except asyncio.CancelledError:
                    pass
                except Exception as err:
                    print(f"[MeetFlow STT] read_transcripts error for {speaker_name}: {err}")

            t1 = asyncio.create_task(forward_audio())
            t2 = asyncio.create_task(read_transcripts())
            active_tasks[track_sid] = (t1, t2)
            await asyncio.gather(t1, t2, return_exceptions=True)

        # Process any tracks that are already published
        for p in ctx.room.remote_participants.values():
            if p.identity == my_identity or p.identity == "meetflow-stt" or p.identity.startswith("agent-"):
                continue
            for pub in p.track_publications.values():
                if pub.track and pub.track.kind == rtc.TrackKind.KIND_AUDIO:
                    asyncio.create_task(transcribe_track(pub.track, pub, p))

        @ctx.room.on("track_subscribed")
        def on_track_subscribed(track: rtc.Track, publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
            if participant.identity == my_identity or participant.identity == "meetflow-stt" or participant.identity.startswith("agent-"):
                return
            if track.kind == rtc.TrackKind.KIND_AUDIO:
                asyncio.create_task(transcribe_track(track, publication, participant))

        @ctx.room.on("track_unsubscribed")
        def on_track_unsubscribed(track: rtc.Track, publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
            if track.sid in active_tasks:
                t1, t2 = active_tasks.pop(track.sid)
                t1.cancel()
                t2.cancel()

        @ctx.room.on("participant_connected")
        def on_participant_connected(participant: rtc.RemoteParticipant):
            print(f"[MeetFlow STT] participant joined={participant.identity} name={participant.name}")

        @ctx.room.on("participant_disconnected")
        def on_participant_disconnected(participant: rtc.RemoteParticipant):
            print(f"[MeetFlow STT] participant disconnected={participant.identity}")
            humans = [p for p in ctx.room.remote_participants.values() if p.identity != my_identity and not p.identity.startswith("agent-")]
            if len(humans) == 0:
                print("[MeetFlow STT] All human participants left, stopping agent session.")
                shutdown_event.set()

        # Wait until the room or session ends so tasks remain active
        await shutdown_event.wait()
        print(f"[MeetFlow STT] Session ended for room {ctx.room.name}")


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            agent_name="meetflow-stt",
        )
    )
