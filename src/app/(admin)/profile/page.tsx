"use client";

import React, { useEffect, useRef, useState } from "react";
import { LogOut, Upload, User } from "lucide-react";
import { PageHeader } from "@/components/figma-shared/Common";
import { FieldLabel, TextInput } from "@/components/figma-shared/Modal";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { Skeleton } from "@/components/ui/skeleton";
import { usePerfilData } from "@/hooks/usePerfilData";
import { useAuth } from "@/contexts/AuthContext";
import { BELTS, BELT_IDS } from "@/components/navigation/belts";

export default function ProfilePage() {
  const { perfil, loading, saving, error, guardar, subirAvatar } = usePerfilData();
  const { signOut } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [puesto, setPuesto] = useState("");
  const [cinturon, setCinturon] = useState<string>("");
  const [guardado, setGuardado] = useState(false);

  // El formulario se siembra una vez que llega el perfil. Sin esto los campos
  // quedarian vacios aunque la base tuviera datos.
  useEffect(() => {
    if (!perfil) return;
    setNombre(perfil.nombre_completo ?? "");
    setTelefono(perfil.telefono ?? "");
    setPuesto(perfil.puesto ?? "");
    setCinturon(perfil.preferencia_cinturon ?? "");
  }, [perfil]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardado(false);
    try {
      await guardar({
        nombre_completo: nombre,
        telefono,
        puesto,
        preferencia_cinturon: cinturon || undefined,
      });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } catch {
      // El hook ya dejo el mensaje en `error`; acá solo se evita que la
      // promesa rechazada burbujee sin manejar.
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-4">
        <Skeleton className="w-full h-[110px] rounded-[2px]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[320px] rounded-[2px]" />
          <Skeleton className="lg:col-span-2 h-[320px] rounded-[2px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <PageHeader
        label="Operative File"
        title="Perfil"
        sub="Tus datos de operativo y la sesión activa en este equipo."
        bgImage="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&h=300&fit=crop&auto=format"
      />

      {error && (
        <FloraGlass className="p-4 border-ember/30">
          <p className="text-xs text-ember font-geist">{error}</p>
        </FloraGlass>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identidad: lo que NO se edita acá (email, alta) mas el avatar. */}
        <FloraGlass className="p-8 flex flex-col items-center text-center">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border border-bone/20 bg-bone/5 flex items-center justify-center">
              {perfil?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={perfil.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-bone/30" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={saving}
              className="absolute inset-0 rounded-full bg-obsidian/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center disabled:cursor-not-allowed"
              aria-label="Cambiar avatar"
            >
              <Upload size={18} className="text-ember" />
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subirAvatar(f).catch(() => {});
              // Se limpia para que elegir el MISMO archivo otra vez vuelva a
              // disparar onChange.
              e.target.value = "";
            }}
          />

          <p className="font-fraunces text-xl font-bold text-bone mt-5 leading-tight">
            {perfil?.nombre_completo || "Sin nombre"}
          </p>
          <p className="text-xs text-bone/50 font-geist mt-1 break-all">
            {perfil?.email}
          </p>
          {perfil?.puesto && (
            <p className="text-[10px] text-ember font-geist uppercase tracking-widest mt-3">
              {perfil.puesto}
            </p>
          )}

          <div className="w-full border-t border-bone/10 mt-6 pt-4">
            <p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest">
              Alta
            </p>
            <p className="text-sm text-bone/70 font-geist mt-1">
              {perfil ? new Date(perfil.fecha_alta).toLocaleDateString() : "—"}
            </p>
          </div>

          {/* Hasta acá la aplicación no tenía NINGUNA forma de cerrar sesión:
              AuthContext exponía signOut desde siempre y nadie lo llamaba
              (registrado en FINDINGS.md tras el rediseño del nav). */}
          <button
            type="button"
            onClick={() => signOut()}
            className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-transparent border border-ember/40 text-ember rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-ember/10 transition-all"
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        </FloraGlass>

        {/* Campos editables. */}
        <FloraGlass className="lg:col-span-2 p-8">
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div>
              <FieldLabel>Nombre completo</FieldLabel>
              <TextInput
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={80}
                placeholder="Cómo querés que te muestre el sistema"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel>Teléfono</FieldLabel>
                <TextInput
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  maxLength={20}
                  placeholder="+506 ..."
                />
              </div>
              <div>
                <FieldLabel>Puesto</FieldLabel>
                <TextInput
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value)}
                  maxLength={60}
                  placeholder="Ej. Fundador, Logística"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Cinturón preferido</FieldLabel>
              <p className="text-[10px] text-bone/40 font-geist mb-3">
                Hoy la barra recuerda tu elección solo en este navegador. Guardarla
                acá la deja lista para que te siga entre equipos.
              </p>
              <div className="flex flex-wrap gap-2">
                {BELT_IDS.map((id) => {
                  const activo = cinturon === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCinturon(activo ? "" : id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-[2px] border text-[10px] font-geist font-bold uppercase tracking-widest transition-colors ${
                        activo
                          ? "bg-ember/10 text-ember border-ember/30"
                          : "bg-bone/5 text-bone/60 border-bone/20 hover:border-bone/50 hover:text-bone"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-bone/30"
                        style={{ backgroundColor: BELTS[id].swatch }}
                      />
                      {BELTS[id].label.replace("Cinturón ", "")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4 border-t border-bone/10 pt-6 mt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-ember text-obsidian rounded-[4px] text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-ember/90 transition-all shadow-[0_0_15px_rgba(255,77,28,0.2)] disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              {guardado && (
                <span className="text-[10px] text-[#7ddb7d] font-geist uppercase tracking-widest">
                  Guardado
                </span>
              )}
            </div>
          </form>
        </FloraGlass>
      </div>
    </div>
  );
}
