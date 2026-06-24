"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function setFY(fy: string) {
  const cookieStore = await cookies()
  cookieStore.set("fy", fy, { path: "/" })
  revalidatePath("/admin", "layout")
}
