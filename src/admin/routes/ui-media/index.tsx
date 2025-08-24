import React, { useEffect, useState } from "react"
import { defineRoute } from "@medusajs/admin-sdk"           // Admin UI Route helper
import { sdk } from "@medusajs/js-sdk"                      // JS SDK

export default defineRoute({
  path: "/content/ui-media",
  label: "İçerik > Carousel",
  icon: "Image",
  element: function UiMediaPage() {
    const [items, setItems] = useState<any[]>([])
    const [file, setFile] = useState<File | null>(null)
    const [title, setTitle] = useState("")
    const [linkUrl, setLinkUrl] = useState("")
    const [sort, setSort] = useState(0)
    const [active, setActive] = useState(true)

    const load = async () => {
      const res = await sdk.admin.request("GET", "/admin/ui-media?type=carousel&limit=100")
      setItems(res.items)
    }

    useEffect(() => { load() }, [])

    const onCreate = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!file) return
      const form = new FormData()
      form.append("files", file)
      const up = await sdk.admin.upload.create(form)
      const image_url = up.files[0].url

      await sdk.admin.request("POST", "/admin/ui-media", {
        type: "carousel",
        title,
        image_url,
        link_url: linkUrl,
        sort_order: Number(sort),
        is_active: active,
        locale: "tr",
      })
      setTitle(""); setLinkUrl(""); setSort(0); setFile(null)
      await load()
    }

    return (
      <div className="p-6 space-y-6">
        <form onSubmit={onCreate} className="grid gap-3 max-w-xl">
          <h2 className="text-xl font-semibold">Yeni Carousel Görseli</h2>
          <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} required />
          <input placeholder="Başlık (ops.)" value={title} onChange={(e)=>setTitle(e.target.value)} />
          <input placeholder="Link URL (ops.)" value={linkUrl} onChange={(e)=>setLinkUrl(e.target.value)} />
          <input type="number" placeholder="Sıra" value={sort} onChange={(e)=>setSort(Number(e.target.value))} />
          <label><input type="checkbox" checked={active} onChange={(e)=>setActive(e.target.checked)} /> Aktif</label>
          <button type="submit">Kaydet</button>
        </form>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Mevcut Carousel</h3>
          <ul className="grid gap-3">
            {items.map((it)=>(
              <li key={it.id} className="border p-3 rounded flex items-center gap-3">
                <img src={it.image_url} alt="" style={{width:120, height:60, objectFit:"cover"}} />
                <div className="flex-1">
                  <div className="font-medium">{it.title || "(başlıksız)"}</div>
                  <div className="text-xs text-gray-500">{it.link_url}</div>
                </div>
                <div className="text-sm">Sıra: {it.sort_order}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  },
})
