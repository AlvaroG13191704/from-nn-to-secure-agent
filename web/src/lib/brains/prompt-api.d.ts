// Minimal typing for Chrome's built-in Prompt API (Gemini Nano), as documented for Chrome 148.
type LanguageModelAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available';
type LanguageModelExpected = { type: 'text'; languages: string[] }[];
type LanguageModelMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type LanguageModelOptions = {
	initialPrompts?: LanguageModelMessage[];
	expectedInputs?: LanguageModelExpected;
	expectedOutputs?: LanguageModelExpected;
	signal?: AbortSignal;
	monitor?: (monitor: EventTarget) => void;
};
interface LanguageModelSession {
	prompt(input: string, options?: { responseConstraint?: unknown; signal?: AbortSignal }): Promise<string>;
	measureContextUsage?(input: string): Promise<number>;
	readonly contextUsage?: number;
	readonly contextWindow?: number;
	destroy(): void;
}
interface LanguageModelStatic {
	availability(options?: LanguageModelOptions): Promise<LanguageModelAvailability>;
	create(options?: LanguageModelOptions): Promise<LanguageModelSession>;
}
declare var LanguageModel: LanguageModelStatic | undefined;
