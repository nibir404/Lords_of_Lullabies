import { ARTISTS } from './artists'
import { MOVEMENTS } from './movements'
import { TECHNOLOGIES } from './technologies'
import type { Relation, RelationType } from './types'

const explicit: Relation[] = [
  { from: 'impressionism', to: 'post-impressionism', type: 'evolution' },
  { from: 'post-impressionism', to: 'expressionism', type: 'evolution' },
  { from: 'expressionism', to: 'abstract-expressionism', type: 'evolution' },
  { from: 'abstract-expressionism', to: 'pop-art', type: 'reaction' },
  { from: 'abstract-expressionism', to: 'minimalism', type: 'reaction' },
  { from: 'minimalism', to: 'conceptual', type: 'evolution' },
  { from: 'generative-art', to: 'ai-art', type: 'evolution' },
  { from: 'ai-art', to: 'post-digital', type: 'evolution' },
  { from: 'pablo-picasso', to: 'georges-braque', type: 'collaboration' },
  { from: 'vincent-van-gogh', to: 'paul-gauguin', type: 'collaboration' },
  { from: 'andy-warhol', to: 'jean-michel-basquiat', type: 'collaboration' },
  { from: 'josef-albers', to: 'anni-albers', type: 'collaboration' },
  { from: 'paul-cezanne', to: 'pablo-picasso', type: 'influence' },
  { from: 'katsushika-hokusai', to: 'vincent-van-gogh', type: 'influence' },
  { from: 'utagawa-hiroshige', to: 'vincent-van-gogh', type: 'influence' },
  { from: 'claude-monet', to: 'wassily-kandinsky', type: 'influence' },
  { from: 'marcel-duchamp', to: 'sol-lewitt', type: 'influence' },
  { from: 'marcel-duchamp', to: 'andy-warhol', type: 'influence' },
  { from: 'jmw-turner', to: 'claude-monet', type: 'influence' },
  { from: 'caravaggio', to: 'rembrandt', type: 'influence' },
  { from: 'caravaggio', to: 'artemisia-gentileschi', type: 'influence' },
  { from: 'kazimir-malevich', to: 'donald-judd', type: 'influence' },
  { from: 'vera-molnar', to: 'casey-reas', type: 'influence' },
  { from: 'harold-cohen', to: 'refik-anadol', type: 'influence' },
  { from: 'piet-mondrian', to: 'bauhaus', type: 'influence' },
  { from: 'hakuin', to: 'minimalism', type: 'influence' },
]

/** Derived edges: declared influences, reactions, artist memberships and technology links. */
export const RELATIONS: Relation[] = (() => {
  const out: Relation[] = [...explicit]
  const seen = new Set(out.map((r) => `${r.from}>${r.to}`))
  const push = (from: string, to: string, type: RelationType) => {
    const key = `${from}>${to}`
    if (seen.has(key)) return
    seen.add(key)
    out.push({ from, to, type })
  }
  for (const mv of MOVEMENTS) {
    for (const src of mv.influencedBy) push(src, mv.id, 'influence')
    for (const src of mv.reactionTo ?? []) push(src, mv.id, 'reaction')
  }
  for (const ar of ARTISTS) for (const mv of ar.movements) push(ar.id, mv, 'movement')
  for (const t of TECHNOLOGIES) for (const mv of t.movements) push(`tech:${t.id}`, mv, 'technology')
  return out
})()

export const RELATION_LABELS: Record<RelationType, string> = {
  influence: 'Influence',
  reaction: 'Reaction',
  evolution: 'Evolution',
  collaboration: 'Collaboration',
  movement: 'Movement',
  technology: 'Technological change',
}

export const RELATION_COLORS: Record<RelationType, string> = {
  influence: '#e8a13a',
  reaction: '#e0482f',
  evolution: '#f2efe8',
  collaboration: '#5fd3b4',
  movement: '#7a8aa8',
  technology: '#9b7bff',
}
