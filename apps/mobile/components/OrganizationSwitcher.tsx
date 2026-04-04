import { useState } from 'react'
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useOrganization } from '@/contexts/OrganizationContext'
import { colors, fontSize, fonts, space } from '@/theme/tokens'

export function OrganizationSwitcher() {
  const insets = useSafeAreaInsets()
  const {
    memberships,
    effectiveActiveOrganizationId,
    setActiveOrganization,
    loading,
  } = useOrganization()
  const [open, setOpen] = useState(false)

  if (loading || memberships.length <= 1) return null

  const active = memberships.find((m) => m.organizationId === effectiveActiveOrganizationId)
  const label = active?.organization.name ?? 'Organização'

  return (
    <>
      <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 8) }]}>
        <Pressable
          onPress={() => setOpen(true)}
          style={styles.chip}
          accessibilityRole="button"
          accessibilityLabel="Trocar organização"
        >
          <Text style={styles.chipText} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.chevron}>▼</Text>
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.backdropFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Organização</Text>
            {memberships.map((m) => (
              <Pressable
                key={m.id}
                style={[
                  styles.option,
                  m.organizationId === effectiveActiveOrganizationId && styles.optionActive,
                ]}
                onPress={async () => {
                  setOpen(false)
                  await setActiveOrganization(m.organizationId)
                }}
              >
                <Text style={styles.optionText}>{m.organization.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space[4],
    paddingBottom: 6,
    backgroundColor: colors.bg.deep,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.green[700],
  },
  chipText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.sm,
    color: colors.text.primary,
    flexShrink: 1,
  },
  chevron: {
    fontSize: 10,
    color: colors.text.muted,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: space[8],
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: colors.bg.void,
    borderRadius: 12,
    padding: space[4],
    borderWidth: 1,
    borderColor: colors.green[800],
    zIndex: 1,
  },
  sheetTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: fontSize.md,
    color: colors.text.primary,
    marginBottom: space[2],
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  optionActive: {
    backgroundColor: colors.green[900],
  },
  optionText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
})
