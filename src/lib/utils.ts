import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fecha de hoy como `YYYY-MM-DD` en la zona horaria local del servidor.
 * Usa `toLocaleDateString('en-CA')` que devuelve el formato canadiense
 * (`YYYY-MM-DD`) respetando la hora local, evitando el desfase de un día
 * que produce `toISOString()` cuando la hora local está por delante de UTC.
 */
export function todayISO(): string {
  return new Date().toLocaleDateString("en-CA");
}
