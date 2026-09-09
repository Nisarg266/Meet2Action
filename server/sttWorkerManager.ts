import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class SttWorkerManager {
  private workerProcess: ChildProcess | null = null;
  private isConnected = false;
  private workerId = '';
  private restartAttempts = 0;
  private shouldRestart = true;

  public getStatus() {
    return {
      configured: true,
      provider: 'LiveKit Inference (google/gemini-3.5-transcribe-live)',
      connected: this.isConnected,
      workerId: this.workerId,
      agentName: 'meetflow-stt',
    };
  }

  public isWorkerConnected(): boolean {
    return this.isConnected;
  }

  public startSttWorker() {
    if (this.workerProcess) {
      return;
    }

    this.shouldRestart = true;
    const agentScript = path.join(projectRoot, 'agent', 'agent.py');
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    console.log(`[MeetFlow STT Manager] Starting LiveKit STT Agent worker with ${pythonCmd} ${agentScript}...`);

    try {
      this.workerProcess = spawn(pythonCmd, [agentScript, 'dev'], {
        cwd: projectRoot,
        env: { ...process.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.workerProcess.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        // Check for worker registration
        if (text.includes('registered worker')) {
          this.isConnected = true;
          this.restartAttempts = 0;
          const match = text.match(/"id":\s*"([^"]+)"/);
          if (match) {
            this.workerId = match[1];
          }
          console.log(`[MeetFlow STT Manager] LiveKit STT Agent connected successfully to LiveKit Cloud (Worker ID: ${this.workerId || 'registered'}).`);
        }

        // Forward stdout with clean prefix if it's STT relevant
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (line.includes('[MeetFlow STT]') || line.includes('registered worker') || line.includes('starting worker')) {
            console.log(line);
          }
        }
      });

      this.workerProcess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        // Ignore known harmless warnings
        if (text.includes('RequestsDependencyWarning') || text.includes('FutureWarning')) {
          return;
        }
        console.warn(`[MeetFlow STT Worker stderr] ${text.trim()}`);
      });

      this.workerProcess.on('exit', (code, signal) => {
        console.warn(`[MeetFlow STT Manager] Worker process exited with code ${code}, signal ${signal}`);
        this.isConnected = false;
        this.workerProcess = null;

        if (this.shouldRestart && this.restartAttempts < 5) {
          this.restartAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.restartAttempts), 10000);
          console.log(`[MeetFlow STT Manager] Restarting worker in ${delay}ms (attempt ${this.restartAttempts}/5)...`);
          setTimeout(() => this.startSttWorker(), delay);
        }
      });
    } catch (err) {
      console.error('[MeetFlow STT Manager] Failed to spawn STT worker process:', err);
    }
  }

  public stopSttWorker() {
    this.shouldRestart = false;
    if (this.workerProcess) {
      console.log('[MeetFlow STT Manager] Stopping STT Agent worker process...');
      this.workerProcess.kill('SIGTERM');
      this.workerProcess = null;
      this.isConnected = false;
    }
  }
}

export const sttWorkerManager = new SttWorkerManager();
