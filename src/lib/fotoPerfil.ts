import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { supabase } from "./supabase";
import { pedirPermisoGaleria } from "./permisos";

// Elige una imagen de la galería, la sube a Supabase Storage
// (bucket "fotos-perfil", ruta "<userId>/foto.jpg") y guarda la URL
// pública en profiles.foto_url. Devuelve la nueva URL, o null si el
// usuario canceló o no dio el permiso.
export async function elegirYSubirFotoPerfil(userId: string): Promise<string | null> {
  const permitido = await pedirPermisoGaleria();
  if (!permitido) return null;

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });

  if (resultado.canceled || !resultado.assets[0]?.base64) return null;

  const base64 = resultado.assets[0].base64;
  const ruta = `${userId}/foto.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("fotos-perfil")
    .upload(ruta, decode(base64), {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("fotos-perfil").getPublicUrl(ruta);
  // Cache-bust: la ruta no cambia entre subidas, así que sin esto el
  // cliente podría seguir mostrando la imagen vieja cacheada.
  const urlConVersion = `${urlData.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ foto_url: urlConVersion })
    .eq("id", userId);

  if (updateError) throw updateError;

  return urlConVersion;
}
