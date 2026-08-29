/**
 * Real (production) implementation of `QuickCreateDataSource`.
 *
 * Everything in here talks to the LIVE ShivAI backend. It was lifted verbatim
 * out of `AgentManagement.tsx` during the QuickCreateAgentWizard extraction so
 * that the wizard component itself has zero direct knowledge of `agentAPI`,
 * WebSocket URLs, or auth tokens — which in turn lets a future "Sub Tenants"
 * page mount the same wizard with a mock/in-memory data source instead.
 *
 * Nothing here should ever be imported by the wizard. The wizard receives an
 * object satisfying `QuickCreateDataSource` as a prop; this module is one such
 * object, and the host page (AgentManagement.tsx) is what wires it in.
 */
import { agentAPI } from "../../../services/agentAPI";
import appToast from "../../../components/AppToast";
import type {
  KbCreationProgress,
  KbFileProgressEntry,
  KbProgressConnection,
  QuickCreateDataSource,
} from "./QuickCreateAgentWizard";

/**
 * Real KB-progress WebSocket. URL construction, message parsing, done/failed
 * handling and the 120s fallback timeout are copied verbatim from the original
 * `connectKbWebSocket` useCallback in AgentManagement.tsx — only the direct
 * `setState` calls were replaced with the callback contract, and the
 * localStorage session persistence stayed here (it is a real-backend concern:
 * it exists so a browser reload can reconnect to a live training run).
 */
function connectKbProgress(
  agentId: string,
  agentName: string,
  callbacks: {
    onProgress: (progress: KbCreationProgress) => void;
    onFileProgress: (entry: KbFileProgressEntry) => void;
    /** Terminal success. `soft` = the 120s fallback fired while still processing. */
    onDone: (soft: boolean) => void;
    /** Terminal failure. */
    onFailed: (message?: string) => void;
    /** Read the latest progress so the fallback timeout can branch on it. */
    getProgress: () => KbCreationProgress;
  },
): KbProgressConnection {
  // Persist session so we can recover on reload
  localStorage.setItem("kb_progress_agentId", agentId);
  localStorage.setItem("kb_progress_agentName", agentName);

  const isStaging = import.meta.env.VITE_API_BASE_URL?.includes("staging");
  const voiceHost = isStaging
    ? "staging.voice.callshivai.com"
    : "voice.callshivai.com";
  const wsUrl = `wss://${voiceHost}/ws/kb-progress/${agentId}`;
  console.log("🔌 Connecting to KB progress WS:", wsUrl);

  let ws: WebSocket | null = new WebSocket(wsUrl);
  let settled = false;

  const closeSocket = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
  };

  const clearSession = () => {
    localStorage.removeItem("kb_progress_agentId");
    localStorage.removeItem("kb_progress_agentName");
  };

  ws.onopen = () => {
    console.log("✅ KB progress WebSocket connected");
    // Original code used a functional setState that only seeded progress when
    // there was none yet; the wizard's onProgress handler preserves that by
    // passing `seedOnly`.
    callbacks.onProgress({
      agentId,
      status: "processing",
      progress: 10,
      message: "Processing knowledge base...",
      __seedOnly: true,
    } as KbCreationProgress & { __seedOnly?: boolean });
  };

  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      console.log("📡 KB WS event:", data);

      const overall = data.overall_percent ?? data.progress ?? 0;
      const stage = data.stage || data.status || "";
      const isDone = stage === "done" || data.status === "completed";
      const isFailed = stage === "error" || data.status === "failed";

      callbacks.onProgress({
        agentId,
        status: isDone ? "completed" : isFailed ? "failed" : "processing",
        progress: isDone ? 100 : Math.min(Math.round(overall), 99),
        message: isDone
          ? "Knowledge base ready!"
          : isFailed
            ? data.error || "Processing failed"
            : data.message || `Processing... ${Math.round(overall)}%`,
      });

      if (data.file_index !== undefined) {
        callbacks.onFileProgress({
          file_index: data.file_index,
          file_name: data.file_name || `File ${data.file_index + 1}`,
          file_percent: data.file_percent ?? 0,
          stage: data.stage || "",
        });
      }

      if (isDone) {
        settled = true;
        closeSocket();
        clearSession();
        callbacks.onProgress({
          agentId,
          status: "completed",
          progress: 100,
          message: "Knowledge base ready!",
        });
        appToast.success(`${agentName} has been created successfully!`, {
          duration: 4000,
        });
        setTimeout(() => callbacks.onDone(false), 1500);
      } else if (isFailed) {
        settled = true;
        closeSocket();
        clearSession();
        appToast.error(
          data.error ||
            `Knowledge base training failed for ${agentName}. Re-upload the files to retry.`,
          { duration: 6000 },
        );
        setTimeout(() => callbacks.onFailed(data.error), 1500);
      }
    } catch {
      console.warn("KB WS: could not parse message");
    }
  };

  ws.onerror = () => console.warn("⚠️ KB progress WS error");

  ws.onclose = () => {
    console.log("🔌 KB progress WS closed");
    ws = null;
  };

  // Fallback: 2-minute timeout — the WS never delivered a final done/error
  // message. Don't assume success: a still-processing state is genuinely
  // unknown (treat as a soft success so the UI doesn't hang forever), but
  // an already-failed state must stay failed.
  const timeoutId = window.setTimeout(() => {
    if (settled) return;
    closeSocket();
    clearSession();
    const prev = callbacks.getProgress();
    if (prev && prev.status === "failed") {
      appToast.error(
        prev.message ||
          `Knowledge base training failed for ${agentName}. Re-upload the files to retry.`,
        { duration: 6000 },
      );
      setTimeout(() => callbacks.onFailed(prev.message), 500);
      return;
    }
    if (prev && prev.status !== "completed") {
      callbacks.onProgress({
        ...prev,
        status: "completed",
        progress: 100,
        message: "Agent created successfully!",
      });
      appToast.success(`${agentName} has been created successfully!`, {
        duration: 4000,
      });
      setTimeout(() => callbacks.onDone(true), 500);
    }
  }, 120000);

  return {
    close: () => {
      settled = true;
      window.clearTimeout(timeoutId);
      closeSocket();
    },
  };
}

/**
 * Voice preview. Copied verbatim from the original `previewGeminiVoice` in
 * AgentManagement.tsx — including the manual localStorage bearer-token read
 * (this endpoint does NOT go through agentAPI). Returns a handle so the caller
 * can stop playback; playback lifecycle callbacks drive the wizard's spinner.
 */
async function previewVoice(
  voiceName: string,
  _speed: number,
  sampleText: string,
  callbacks: {
    onCanPlay: () => void;
    onEnded: () => void;
    onError: () => void;
  },
): Promise<{ stop: () => void }> {
  console.log(`🎙️ Voice preview: voiceName=${voiceName}, speed=${_speed}`);

  // Get auth token same as other API calls
  const authTokens = localStorage.getItem("auth_tokens");
  const accessToken = authTokens ? JSON.parse(authTokens)?.accessToken : null;

  const response = await fetch(
    "https://nodejs.service.callshivai.com/api/v1/voice/generate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        voiceName: voiceName,
        text: sampleText,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Voice preview failed: ${response.status}`);
  }

  // Response: { success, data: { audioDataUrl, audioBase64, audioFormat, ... } }
  const json = await response.json();
  const audioData = json.data;
  let audioUrl: string;
  let isDataUrl = false;

  if (audioData?.audioDataUrl) {
    // Use the ready-made data URL directly
    audioUrl = audioData.audioDataUrl;
    isDataUrl = true;
  } else if (audioData?.audioBase64) {
    const byteChars = atob(audioData.audioBase64);
    const byteNums = new Array(byteChars.length)
      .fill(0)
      .map((_, i) => byteChars.charCodeAt(i));
    const byteArray = new Uint8Array(byteNums);
    audioUrl = URL.createObjectURL(new Blob([byteArray], { type: "audio/mp3" }));
  } else {
    throw new Error("No audio data in response");
  }

  const audio = new Audio(audioUrl);

  audio.oncanplay = () => callbacks.onCanPlay();

  audio.onended = () => {
    if (!isDataUrl) URL.revokeObjectURL(audioUrl);
    callbacks.onEnded();
  };

  audio.onerror = () => {
    if (!isDataUrl) URL.revokeObjectURL(audioUrl);
    callbacks.onError();
  };

  await audio.play();

  return {
    stop: () => {
      audio.pause();
    },
  };
}

export const realAgentDataSource: QuickCreateDataSource = {
  createAgentFull: (payload) => agentAPI.createAgentFull(payload),
  uploadKnowledgeBase: (files) => agentAPI.uploadKnowledgeBase(files),
  getAgentConfig: (agentId) => agentAPI.getAgentConfig(agentId),
  connectKbProgress,
  previewVoice,
};

export default realAgentDataSource;
