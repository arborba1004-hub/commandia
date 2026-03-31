import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { usePlayerStore } from '@/store/playerStore'
import { Image } from '@/components/ui/image'
import { motion } from 'framer-motion'
import { useMemo } from 'react'

const ITEMS = [
  { key: 'ring', name: 'Anel' },
  { key: 'bracelet', name: 'Pulseira' },
  { key: 'chain', name: 'Corrente' },
  { key: 'watch', name: 'Relógio' },
  { key: 'bag', name: 'Bolsa' },
  { key: 'sunglasses', name: 'Óculos' }
]

function getBonus(level: number) {
  if (level < 50) return 1
  return 1 + (level - 50) * 0.1
}

function getVisualByLevel(level: number) {
  const colors = [/* mantém seu array aqui */]
  const color = colors[(level - 1) % colors.length]

  return {
    filter: 'brightness(1.3) contrast(1.4) saturate(1.6)',
    glow: `
      drop-shadow(0 0 10px rgba(255,255,255,0.6))
      drop-shadow(0 0 25px ${color})
      drop-shadow(0 0 50px ${color})
    `,
    halo: `radial-gradient(circle, ${color}55 0%, transparent 70%)`
  }
}

export default function LuxuryShowroomPage() {
  const { player, setPlayer } = usePlayerStore()

  const level = player?.barracoLevel || 1
  const cleanMoney = player?.balances?.cleanMoney || 0
  const inventory = player?.inventory?.luxuryItems || []

  const visual = useMemo(() => getVisualByLevel(level), [level])

  const handleBuy = (itemKey: string, insured: boolean) => {
    const alreadyOwned = inventory.some(
      (i: any) => i.id === `${itemKey}-${level}`
    )

    if (alreadyOwned) return

    const price = level * 1000
    const finalPrice = insured ? price * 1.1 : price

    if (cleanMoney < finalPrice) return

    const newItem = {
      id: `${itemKey}-${level}`,
      type: itemKey,
      level,
      bonus: getBonus(level),
      insured
    }

    setPlayer({
      ...player,
      balances: {
        ...player.balances,
        cleanMoney: cleanMoney - finalPrice
      },
      inventory: {
        ...player.inventory,
        luxuryItems: [...inventory, newItem]
      }
    })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="pt-24 px-6 max-w-7xl mx-auto">

        {/* TÍTULO */}
        <motion.h1
          className="text-5xl font-black text-center mb-12"
          style={{
            textShadow: '0 0 20px rgba(255,255,255,0.4)'
          }}
        >
          LUXURY SHOWROOM
        </motion.h1>

        {/* GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">

          {ITEMS.map(item => {
            const owned = inventory.some(
              (i: any) => i.id === `${item.key}-${level}`
            )

            const price = level * 1000

            return (
              <motion.div
                key={item.key}
                className="relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
                whileHover={{ scale: 1.05 }}
              >

                {/* HALO */}
                <div
                  className="absolute inset-0 rounded-2xl blur-2xl"
                  style={{ background: visual.halo }}
                />

                {/* IMAGEM */}
                <div className="relative flex justify-center mb-4">
                  <Image
                    src={`/luxury/${item.key}.png`}
                    width={200}
                    style={{
                      filter: `${visual.filter} ${visual.glow}`,
                      mixBlendMode: 'screen'
                    }}
                  />
                </div>

                {/* NOME */}
                <h2 className="text-xl font-bold text-center mb-2">
                  {item.name}
                </h2>

                {/* BONUS */}
                <p className="text-center text-sm mb-2">
                  +{getBonus(level)}%
                </p>

                {/* PREÇO */}
                <p className="text-center text-xs opacity-70 mb-4">
                  {price} Commands
                </p>

                {/* BOTÕES */}
                {owned ? (
                  <div className="text-center text-green-400">
                    Comprado
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">

                    <button
                      onClick={() => handleBuy(item.key, false)}
                      className="bg-white/10 hover:bg-white/20 py-2 rounded-xl"
                    >
                      Comprar
                    </button>

                    <button
                      onClick={() => handleBuy(item.key, true)}
                      className="bg-yellow-500/20 hover:bg-yellow-500/30 py-2 rounded-xl"
                    >
                      Comprar + Seguro
                    </button>

                  </div>
                )}

              </motion.div>
            )
          })}
        </div>
      </main>

      <Footer />
    </div>
  )
}