// src/app/index.tsx
import { Redirect } from "expo-router";

// Este arquivo apenas redireciona o aplicativo para abrir o sistema de abas automaticamente
export default function Index() {
  return <Redirect href="/inicio" />;
}
