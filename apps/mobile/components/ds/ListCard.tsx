/**
 * ListCard — padrão de card do design system.
 * Usado em listas (ex.: Missões de hoje): ícone à esquerda, título, subtítulo, chevron quando ativo.
 */

import { View, Text, Pressable } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { ds } from '@/theme/ds'
import { colors } from '@/theme/tokens'

export type ListCardVariant = 'default' | 'locked' | 'done'

export interface ListCardProps {
  title: string
  subtitle: string
  /** Conteúdo do bloco à esquerda (ex.: ícone dentro do container colorido) */
  left: React.ReactNode
  /** Mostrar chevron à direita (geralmente false quando locked) */
  showChevron?: boolean
  /** Desabilita press e reduz opacidade visual */
  disabled?: boolean
  onPress?: () => void
}

export function ListCard({
  title,
  subtitle,
  left,
  showChevron = true,
  disabled = false,
  onPress,
}: ListCardProps) {
  const content = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: ds.space.md }}>
        {left}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={[ds.typography.cardTitle, disabled && { color: colors.text.muted }]}
          >
            {title}
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[ds.typography.cardSubtitle, { marginTop: 2 }]}
          >
            {subtitle}
          </Text>
        </View>
        {showChevron && !disabled && <ChevronRight size={18} color={colors.text.muted} />}
      </View>
    </>
  )

  const cardStyle = {
    backgroundColor: colors.bg.card,
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: ds.space.lg,
    opacity: disabled ? 0.85 : 1,
  }

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && { opacity: 0.9 }]}
      >
        {content}
      </Pressable>
    )
  }

  return <View style={cardStyle}>{content}</View>
}

/** Container padrão para o ícone à esquerda do ListCard — mesmo estilo do slot do card Seu Broto. */
export function ListCardIconSlot({
  children,
  backgroundColor,
}: {
  children: React.ReactNode
  backgroundColor: string
}) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: ds.radius.md,
        backgroundColor,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  )
}
