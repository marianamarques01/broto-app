import { memo, useCallback, useEffect, useId, useState } from 'react'
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
  LayoutChangeEvent,
  Text,
} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Path, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg'
import { House } from 'phosphor-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { BottomTabBarProps, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs'
import type { NavigationHelpers, ParamListBase, Route } from '@react-navigation/native'
import { colors, fonts, fontSize } from '@/theme/tokens'

/** Índice da rota `index` (Início) no dock — fica no centro, "voando". */
const CENTER_INDEX = 2
const CORNER = 20
const SVG_HEIGHT = 80
const FLYING_BTN = 60
/** Quanto o botão sobe além de "metade fora" da barra — aumentado para voar de verdade */
const FLOAT_EXTRA = 28
/** Barra escura vítrea (como o print — não pílula clara) */
const DOCK_DARK = 'rgba(12, 22, 18, 0.92)'
const DOCK_STROKE = 'rgba(16, 185, 129, 0.2)'

const ACTIVE = colors.blue[500]
const CENTER_INACTIVE = colors.text.muted
const GLOW = 'rgba(78, 205, 196, 0.55)'

type TabBarItemProps = {
  isFocused: boolean
  options: BottomTabNavigationOptions
  navigation: NavigationHelpers<ParamListBase, {}>
  routeName: string
  routeKey: string
  routeParams: undefined | object
}

function getShortLabel(
  options: BottomTabNavigationOptions,
  routeName: string,
): string {
  const t = (options as { title?: string }).title
  const l = (options as { tabBarLabel?: string | (() => string) }).tabBarLabel
  if (typeof t === 'string' && t) return t
  if (typeof l === 'string' && l) return l
  return routeName
}

const TabBarItem = memo(function TabBarItem({
  isFocused,
  options,
  navigation,
  routeName,
  routeKey,
  routeParams,
}: TabBarItemProps) {
  const label = getShortLabel(options, routeName)

  const onPress = useCallback(() => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    } as never) as { defaultPrevented?: boolean }
    if (!isFocused && !event.defaultPrevented) {
      ;(navigation as { navigate: (n: string, p?: object) => void }).navigate(
        routeName,
        routeParams,
      )
    }
  }, [isFocused, navigation, routeKey, routeName, routeParams])

  const onLongPress = useCallback(() => {
    navigation.emit({ type: 'tabLongPress', target: routeKey } as never)
  }, [navigation, routeKey])

  const color = isFocused ? ACTIVE : colors.text.muted
  const labelColor = isFocused ? ACTIVE : colors.text.muted

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={String(label)}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
    >
      {options.tabBarIcon?.({
        focused: isFocused,
        color,
        size: 22,
      })}
      <Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          { color: labelColor, fontWeight: isFocused ? '600' : '500' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
})

/** Barra sem notch — topo plano para o botão voar livremente acima */
function buildDockPath(w: number, h: number): string {
  return [
    'M 0 26',
    'Q 0 10', String(CORNER), '10',
    'L', String(w - CORNER), '10',
    'Q', String(w), '10', String(w), '26',
    'L', String(w), String(h - CORNER),
    'Q', String(w), String(h), String(w - CORNER), String(h),
    'L', String(CORNER), String(h),
    'Q 0', String(h), '0', String(h - CORNER),
    'L 0 26',
    'Z',
  ].join(' ')
}

const FloatingHome = memo(function FloatingHome({
  isFocused,
  onPress,
  onLongPress,
  label,
}: {
  isFocused: boolean
  onPress: () => void
  onLongPress: () => void
  label: string
}) {
  const glowId = `homeGlow-${useId().replace(/:/g, '')}`
  const floatY = useSharedValue(0)

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    )
  }, [])

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }))

  return (
    <View style={styles.fabColumn} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={label}
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.fabPress, pressed && styles.fabPressed]}
      >
        <Animated.View style={[styles.fabFloatLayer, floatStyle]}>
          <View style={styles.halo} pointerEvents="none" />
          <View style={styles.glowSlot}>
            <Svg
              width={112}
              height={52}
              style={styles.glowSvg}
            >
              <Defs>
                <RadialGradient
                  id={glowId}
                  cx="50%"
                  cy="100%"
                  rx="50%"
                  ry="80%"
                  fx="50%"
                  fy="100%"
                >
                  <Stop
                    offset="0%"
                    stopColor={GLOW}
                    stopOpacity={isFocused ? 0.95 : 0.4}
                  />
                  <Stop
                    offset="100%"
                    stopColor={GLOW}
                    stopOpacity="0"
                  />
                </RadialGradient>
              </Defs>
              <Ellipse
                cx={56}
                cy={40}
                rx={52}
                ry={26}
                fill={`url(#${glowId})`}
              />
            </Svg>
          </View>
          <View
            style={[
              styles.fabCircle,
              {
                borderColor: isFocused ? ACTIVE : CENTER_INACTIVE,
                backgroundColor: isFocused ? 'rgba(43, 164, 184, 0.22)' : colors.bg.elevated,
              },
            ]}
          >
            <House
              size={30}
              color={isFocused ? ACTIVE : CENTER_INACTIVE}
              weight="bold"
            />
          </View>
        </Animated.View>
      </Pressable>
      <Text
        numberOfLines={1}
        style={[
          styles.tabLabel,
          styles.centerLabel,
          { color: isFocused ? ACTIVE : colors.text.muted },
        ]}
      >
        {label}
      </Text>
    </View>
  )
})

export const MobileTabBar = memo(function MobileTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const [dockW, setDockW] = useState(0)
  const bottomPad = Math.max(insets.bottom, 8)

  const onDockLayout = useCallback((e: LayoutChangeEvent) => {
    setDockW(e.nativeEvent.layout.width)
  }, [])

  const centerRoute = state.routes[CENTER_INDEX]
  const centerDesc = centerRoute && descriptors[centerRoute.key]
  const centerOptions = centerDesc?.options
  const isCenterFocused = state.index === CENTER_INDEX
  const centerLabelText = getShortLabel(centerOptions ?? {}, 'index')

  const onCenterPress = useCallback(() => {
    if (!centerRoute) return
    const event = navigation.emit({
      type: 'tabPress',
      target: centerRoute.key,
      canPreventDefault: true,
    } as never) as { defaultPrevented?: boolean }
    if (!isCenterFocused && !event.defaultPrevented) {
      ;(navigation as { navigate: (n: string, p?: object) => void }).navigate(
        centerRoute.name,
        centerRoute.params,
      )
    }
  }, [centerRoute, isCenterFocused, navigation])

  const onCenterLongPress = useCallback(() => {
    if (!centerRoute) return
    navigation.emit({ type: 'tabLongPress', target: centerRoute.key } as never)
  }, [centerRoute, navigation])

  const renderTab = (route: Route<string>, index: number) => {
    const { options } = descriptors[route.key]
    return (
      <TabBarItem
        key={route.key}
        isFocused={state.index === index}
        options={options}
        navigation={navigation}
        routeName={route.name}
        routeKey={route.key}
        routeParams={route.params}
      />
    )
  }

  return (
    <View
      style={[
        styles.screenWrap,
        { paddingBottom: bottomPad, paddingTop: 28 + FLOAT_EXTRA },
      ]}
    >
      <View
        style={styles.dockBox}
        onLayout={onDockLayout}
      >
        {dockW > 0 && (
          <Svg
            width={dockW}
            height={SVG_HEIGHT}
            style={styles.dockSvg}
          >
            <Path
              d={buildDockPath(dockW, SVG_HEIGHT)}
              fill={DOCK_DARK}
              stroke={DOCK_STROKE}
              strokeWidth={1}
            />
          </Svg>
        )}

        {centerRoute && (
          <FloatingHome
            isFocused={isCenterFocused}
            onPress={onCenterPress}
            onLongPress={onCenterLongPress}
            label={centerLabelText}
          />
        )}

        <View style={styles.dockRow}>
          <View style={styles.dockSide}>
            {state.routes
              .slice(0, CENTER_INDEX)
              .map((r: Route<string>, i: number) => renderTab(r, i))}
          </View>
          <View style={styles.dockSpacer} />
          <View style={styles.dockSide}>
            {state.routes
              .slice(CENTER_INDEX + 1)
              .map((r: Route<string>, j: number) =>
                renderTab(r, CENTER_INDEX + 1 + j),
              )}
          </View>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  screenWrap: {
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  dockBox: {
    width: '100%',
    minHeight: SVG_HEIGHT,
    position: 'relative',
    overflow: 'visible',
  },
  dockSvg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: SVG_HEIGHT,
    paddingBottom: 6,
    paddingTop: 4,
  },
  dockSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  dockSpacer: {
    width: FLYING_BTN + 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 52,
    paddingBottom: 2,
  },
  tabPressed: {
    opacity: 0.9,
  },
  tabLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.xs,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  centerLabel: {
    marginTop: 4,
    fontSize: 10,
  },
  fabColumn: {
    position: 'absolute',
    // FLYING_BTN/2 = 30 (metade do botão) + FLOAT_EXTRA = 28 → botão fica 28px acima da barra
    top: -(FLYING_BTN / 2 + FLOAT_EXTRA),
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: 'center',
  },
  fabPress: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabFloatLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPressed: {
    opacity: 0.88,
  },
  /** Halo suave atrás do botão — reforça "suspenso" no ar */
  halo: {
    position: 'absolute',
    width: FLYING_BTN + 32,
    height: FLYING_BTN + 32,
    borderRadius: (FLYING_BTN + 32) / 2,
    backgroundColor: 'rgba(43, 164, 184, 0.12)',
  },
  glowSlot: {
    position: 'absolute',
    width: 112,
    height: 52,
    bottom: -10,
    alignItems: 'center',
  },
  glowSvg: {
    position: 'absolute',
    bottom: 0,
  },
  fabCircle: {
    width: FLYING_BTN,
    height: FLYING_BTN,
    borderRadius: FLYING_BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 20 },
      default: {},
    }),
  },
})