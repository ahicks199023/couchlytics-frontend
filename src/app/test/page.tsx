// src/app/test/page.tsx

export default function TailwindTest() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="p-8 bg-neon-green text-black rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Tailwind is Working!</h1>
        <p className="text-lg">If you can see this styled block, Tailwind CSS is applied correctly.</p>
      </div>
    </div>
  )
}
