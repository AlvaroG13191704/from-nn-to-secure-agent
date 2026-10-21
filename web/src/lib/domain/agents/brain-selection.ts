export type BrainKind = 'nano' | 'flash';
export type NanoStatus = 'ready' | 'needs-download' | 'downloading' | 'unsupported' | 'unavailable';
export type BrainSelection = { brain: BrainKind; status: NanoStatus; message: string };

/** Hardware and browser requirements published in the Chrome Prompt API documentation. */
export const NANO_REQUIREMENTS = { minChromeVersion: 148, freeDiskGb: 22, minRamGb: 16, minCpuCores: 4, minVramGb: 4 } as const;

const FLASH_FALLBACK = 'En el laboratorio usarás Gemini Flash a través del servidor del taller, con un presupuesto limitado. Cuida tus tokens.';

/** Maps the result of LanguageModel.availability() to the brain a student will use in the lab. */
export function classifyNanoAvailability(input: { supported: boolean; availability?: string; error?: string }): BrainSelection {
	if (!input.supported) return { brain: 'flash', status: 'unsupported', message: `Tu navegador no tiene Gemini Nano integrado: necesitas Chrome ${NANO_REQUIREMENTS.minChromeVersion} o superior en una computadora. ${FLASH_FALLBACK}` };
	switch (input.error ? 'error' : input.availability) {
		case 'available':
			return { brain: 'nano', status: 'ready', message: 'Gemini Nano está listo en tu computadora. En el laboratorio tu agente pensará aquí mismo, gratis y sin enviar tus datos a internet.' };
		case 'downloadable':
			return { brain: 'nano', status: 'needs-download', message: 'Tu computadora puede usar Gemini Nano, pero falta descargarlo. Hazlo en casa con una conexión estable: pesa varios gigabytes.' };
		case 'downloading':
			return { brain: 'nano', status: 'downloading', message: 'Gemini Nano se está descargando. Deja esta página abierta hasta que termine.' };
		default:
			return { brain: 'flash', status: 'unavailable', message: `Tu computadora no cumple los requisitos de Gemini Nano o Chrome no lo habilitó. ${FLASH_FALLBACK}` };
	}
}
