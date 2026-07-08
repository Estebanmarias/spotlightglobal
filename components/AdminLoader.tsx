type AdminLoaderProps = {
  size?: number
  label?: string
  fullScreen?: boolean
}

export default function AdminLoader({ size = 32, label, fullScreen = false }: AdminLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <span
        className="border-2 border-[#c6c6cf] border-t-[#081534] rounded-full animate-spin"
        style={{ width: size, height: size }}
      />
      {label && <p className="text-[#45464e] text-[13px] font-semibold">{label}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}