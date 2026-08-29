/**
 * Mock implementation of `QuickCreateDataSource` for the Sub Tenants module —
 * lets the exact same QuickCreateAgentWizard component used on the real
 * AgentManagement page create/preview AI employees against a per-tenant
 * in-memory store (mockAgentStore.ts) instead of the live backend.
 *
 * Per product decision: no fake KB-training progress simulation and no fake
 * TTS audio — knowledge base "training" completes instantly, and voice
 * preview shows a toast instead of playing synthesized audio.
 */
import appToast from '../../../components/AppToast';
import { mockAgentStore } from '../../../services/mockAgentStore';
import type {
  KbCreationProgress,
  KbFileProgressEntry,
  KbProgressConnection,
  QuickCreateDataSource,
} from './QuickCreateAgentWizard';

/** Mock KB-progress channel: reports completion on the next tick, per the
 * "stub it out simply" product decision — no real training pipeline exists
 * for mock agents. */
function connectKbProgress(
  agentId: string,
  agentName: string,
  callbacks: {
    onProgress: (progress: KbCreationProgress) => void;
    onFileProgress: (entry: KbFileProgressEntry) => void;
    onDone: (soft: boolean) => void;
    onFailed: (message?: string) => void;
    getProgress: () => KbCreationProgress;
  },
): KbProgressConnection {
  let cancelled = false;
  const timeoutId = window.setTimeout(() => {
    if (cancelled) return;
    callbacks.onProgress({
      agentId,
      status: 'completed',
      progress: 100,
      message: 'Knowledge base ready!',
    });
    appToast.success(`${agentName} has been created successfully!`, { duration: 4000 });
    callbacks.onDone(false);
  }, 600);

  return {
    close: () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    },
  };
}

/** Mock voice preview — no real TTS/audio in the sub-tenant preview. Resolves
 * immediately after telling the wizard playback "started" so its loading
 * spinner clears right away, then shows an explanatory toast. */
async function previewVoice(
  _voiceName: string,
  _speed: number,
  _sampleText: string,
  callbacks: { onCanPlay: () => void; onEnded: () => void; onError: () => void },
): Promise<{ stop: () => void }> {
  callbacks.onCanPlay();
  appToast.info("Voice preview isn't available in this preview.");
  setTimeout(() => callbacks.onEnded(), 300);
  return { stop: () => {} };
}

/** Builds a QuickCreateDataSource scoped to one sub-tenant. */
export function createMockAgentDataSource(
  tenantId: string,
  onAgentCreated: () => void,
): QuickCreateDataSource {
  return {
    createAgentFull: async (payload) => {
      const agent = mockAgentStore.create(tenantId, payload);
      onAgentCreated();
      return agent;
    },
    uploadKnowledgeBase: async (files) => {
      const result = mockAgentStore.uploadKnowledgeBase(files);
      return { success: true, statusCode: 200, message: 'Uploaded', data: result };
    },
    getAgentConfig: async (agentId) => mockAgentStore.get(tenantId, agentId),
    connectKbProgress,
    previewVoice,
  };
}
