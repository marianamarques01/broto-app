import { memo } from 'react';
import { View, Platform } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { colors } from '@/theme/tokens';

const SPRING_CONFIG = {
    damping: 15,
    stiffness: 200,
    mass: 0.8,
};

const containerBase = {
    minHeight: 56,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
};
const indicatorBase = {
    position: 'absolute' as const,
    top: -6,
    height: 2,
    width: 32,
    borderRadius: 1,
    backgroundColor: colors.cta.gradientEnd,
    boxShadow: '0px 2px 8px rgba(98, 189, 105, 0.45)',
    elevation: 4,
};
const iconBoxBase = {
    height: 40,
    width: 40,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
};

export const TabIcon = memo(function TabIcon({
    focused,
    Icon,
}: {
    focused: boolean;
    Icon: PhosphorIcon;
}) {
    const iconContainerStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: withSpring(focused ? 1.1 : 1, SPRING_CONFIG) },
        ],
        backgroundColor: withTiming(
            focused ? 'rgba(98, 189, 105, 0.22)' : 'transparent',
            Platform.OS === 'web' ? { duration: 200 } : { duration: 200, easing: Easing.out(Easing.quad) },
        ),
    }));

    const indicatorStyle = useAnimatedStyle(() => ({
        opacity: withTiming(focused ? 1 : 0, { duration: 200 }),
        transform: [{ scaleX: withSpring(focused ? 1 : 0.3, SPRING_CONFIG) }],
    }));

    return (
        <View style={containerBase}>
            <Animated.View style={[indicatorBase, indicatorStyle]} />
            <Animated.View style={[iconBoxBase, iconContainerStyle]}>
                <Icon
                    size={24}
                    color={focused ? colors.cta.gradientEnd : colors.text.muted}
                    weight={focused ? 'fill' : 'regular'}
                />
            </Animated.View>
        </View>
    );
});
