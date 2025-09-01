import React, { useEffect, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"

function UiMediaPage() {
  const [items, setItems] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [sort, setSort] = useState(items.length)
  const [active, setActive] = useState(true)
  const [selectedType, setSelectedType] = useState<"carousel" | "banner">("carousel")
  const [activeTab, setActiveTab] = useState<"carousel" | "banner">("carousel")
  const [editingItem, setEditingItem] = useState<any>(null)
  const [draggedItem, setDraggedItem] = useState<any>(null)

  const load = async (type: "carousel" | "banner" = activeTab) => {
    try {
      const response = await fetch(`/admin/ui-media?type=${type}&limit=100`)
      const data = await response.json()
      
      if (response.ok) {
        setItems(data.items || [])
      } else {
        console.error("Error loading UI media:", data.error)
        setItems([])
      }
    } catch (error: any) {
      console.error("Error loading UI media:", error)
      setItems([])
    }
  }

  useEffect(() => { 
    load(activeTab) 
  }, [activeTab])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    
    try {
      // First upload the file
      const form = new FormData()
      form.append("files", file)
      
      const uploadResponse = await fetch("/admin/uploads", {
        method: "POST",
        body: form,
      })
      const uploadData = await uploadResponse.json()
      const image_url = uploadData.files?.[0]?.url
      
      if (!image_url) {
        throw new Error("File upload failed")
      }

      // Then create the UI media entry
      const createResponse = await fetch("/admin/ui-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: selectedType,
          title,
          image_url,
          link_url: linkUrl,
          sort_order: Number(sort),
          is_active: active,
          locale: "tr",
        }),
      })

      if (createResponse.ok) {
        setTitle("")
        setLinkUrl("")
        setSort(items.length + 1)
        setFile(null)
        // Reload the current tab to show the new item
        await load(selectedType)
        // Switch to the tab where the item was added if different
        if (selectedType !== activeTab) {
          setActiveTab(selectedType)
        }
      } else {
        const errorData = await createResponse.json()
        throw new Error(`Failed to create UI media: ${errorData.error || createResponse.statusText}`)
      }
    } catch (error: any) {
      console.error("Error creating UI media:", error)
      alert(`Error creating UI media: ${error.message}`)
    }
  }

  const onDelete = async (id: string) => {
    if (!confirm("Bu medyayı silmek istediğinizden emin misiniz?")) return
    
    try {
      const response = await fetch(`/admin/ui-media/${id}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        await load()
      } else {
        const errorData = await response.json()
        throw new Error(`Failed to delete: ${errorData.error || response.statusText}`)
      }
    } catch (error: any) {
      console.error("Error deleting UI media:", error)
      alert(`Error deleting: ${error.message}`)
    }
  }

  const onToggleActive = async (item: any) => {
    try {
      const response = await fetch(`/admin/ui-media/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...item,
          is_active: !item.is_active,
        }),
      })
      
      if (response.ok) {
        await load()
      } else {
        const errorData = await response.json()
        throw new Error(`Failed to update: ${errorData.error || response.statusText}`)
      }
    } catch (error: any) {
      console.error("Error updating UI media:", error)
      alert(`Error updating: ${error.message}`)
    }
  }

  const onUpdateOrder = async (newItems: any[]) => {
    try {
      // Update sort_order for all items
      const updates = newItems.map((item, index) => ({
        id: item.id,
        sort_order: index
      }))
      
      const response = await fetch("/admin/ui-media/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      })
      
      if (response.ok) {
        await load()
      } else {
        const errorData = await response.json()
        throw new Error(`Failed to reorder: ${errorData.error || response.statusText}`)
      }
    } catch (error: any) {
      console.error("Error reordering UI media:", error)
      alert(`Error reordering: ${error.message}`)
    }
  }

  const onDragStart = (e: React.DragEvent, item: any) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = "move"
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const onDrop = (e: React.DragEvent, targetItem: any) => {
    e.preventDefault()
    if (!draggedItem || draggedItem.id === targetItem.id) return
    
    const newItems = [...items]
    const draggedIndex = newItems.findIndex(item => item.id === draggedItem.id)
    const targetIndex = newItems.findIndex(item => item.id === targetItem.id)
    
    // Remove dragged item and insert at target position
    newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, draggedItem)
    
    setItems(newItems)
    onUpdateOrder(newItems)
    setDraggedItem(null)
  }

  const startEdit = (item: any) => {
    setEditingItem({ ...item })
  }

  const cancelEdit = () => {
    setEditingItem(null)
  }

  const saveEdit = async () => {
    if (!editingItem) return
    
    try {
      const response = await fetch(`/admin/ui-media/${editingItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingItem),
      })
      
      if (response.ok) {
        setEditingItem(null)
        await load()
      } else {
        const errorData = await response.json()
        throw new Error(`Failed to update: ${errorData.error || response.statusText}`)
      }
    } catch (error: any) {
      console.error("Error updating UI media:", error)
      alert(`Error updating: ${error.message}`)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <form onSubmit={onCreate} className="grid gap-3 max-w-xl">
        <h2 className="text-xl font-semibold">Yeni Medya Ekle</h2>
        
        <div>
          <label className="block text-sm font-medium mb-2">Tür</label>
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value as "carousel" | "banner")}
            className="w-full p-2 border rounded"
          >
            <option value="carousel">Carousel</option>
            <option value="banner">Banner</option>
          </select>
        </div>

        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} 
          required 
        />
        <input 
          placeholder="Başlık (opsiyonel)" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
        />
        <input 
          placeholder="Link URL (opsiyonel)" 
          value={linkUrl} 
          onChange={(e) => setLinkUrl(e.target.value)} 
        />
        <label htmlFor="sort">Sıra</label>
        <input 
          type="number" 
          placeholder="Sıra" 
          value={Math.max(0, items.length - 1)} 
          onChange={(e) => setSort(Number(e.target.value + 1))} 
          disabled
        />
        <label>
          <input 
            type="checkbox" 
            checked={active} 
            onChange={(e) => setActive(e.target.checked)} 
          /> 
          Aktif
        </label>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Kaydet
        </button>
      </form>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("carousel")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "carousel"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Carousel Resimleri
          </button>
          <button
            onClick={() => setActiveTab("banner")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "banner"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Banner Resimleri
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">
          Mevcut {activeTab === "carousel" ? "Carousel" : "Banner"} Resimleri
        </h3>
        <p className="text-sm text-gray-600">
          💡 Sürükle-bırak ile sıralama yapabilir, düzenle butonu ile içeriği değiştirebilirsiniz.
        </p>
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Henüz {activeTab === "carousel" ? "carousel" : "banner"} resmi bulunmuyor.
          </p>
        ) : (
          <ul className="grid gap-3">
            {items.map((item) => (
              <li 
                key={item.id} 
                className={`border p-3 rounded flex items-center gap-3 bg-white shadow-sm cursor-move hover:shadow-md transition-all duration-200 ${
                  draggedItem?.id === item.id ? 'opacity-50 transform scale-105' : ''
                } ${
                  editingItem?.id === item.id ? 'ring-2 ring-blue-500' : ''
                }`}
                draggable
                onDragStart={(e) => onDragStart(e, item)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, item)}
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1 text-gray-400 cursor-grab">
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                    <div className="w-1 h-1 bg-current rounded-full"></div>
                  </div>
                  <img 
                    src={item.image_url} 
                    alt={item.title || "Resim"} 
                    style={{width: 120, height: 60, objectFit: "cover"}} 
                    className="rounded"
                  />
                </div>
                <div className="flex-1">
                  {editingItem?.id === item.id ? (
                    <div className="space-y-2">
                      <input
                        value={editingItem.title || ""}
                        onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                        placeholder="Başlık"
                        className="w-full p-1 border rounded text-sm"
                      />
                      <input
                        value={editingItem.link_url || ""}
                        onChange={(e) => setEditingItem({...editingItem, link_url: e.target.value})}
                        placeholder="Link URL"
                        className="w-full p-1 border rounded text-sm"
                      />
                      <input
                        type="number"
                        value={editingItem.sort_order || 0}
                        onChange={(e) => setEditingItem({...editingItem, sort_order: Number(e.target.value)})}
                        placeholder="Sıra"
                        className="w-20 p-1 border rounded text-sm"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="font-medium">{item.title || "(başlıksız)"}</div>
                      {item.link_url && (
                        <div className="text-xs text-gray-500 truncate">{item.link_url}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Sıra: {item.sort_order}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingItem?.id === item.id ? (
                    <>
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Kaydet
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        İptal
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(item)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => onToggleActive(item)}
                        className={`px-3 py-1 rounded text-sm ${
                          item.is_active 
                            ? "bg-yellow-500 text-white hover:bg-yellow-600" 
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        {item.is_active ? "Pasif Yap" : "Aktif Yap"}
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Sil
                      </button>
                    </>
                  )}
                </div>
                <div className={`px-2 py-1 rounded text-xs ${
                  item.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {item.is_active ? "Aktif" : "Pasif"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "UI Media",
})

export default UiMediaPage

