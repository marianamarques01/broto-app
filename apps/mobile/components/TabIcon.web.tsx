import { View } from 'react-native';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { colors } from '@/theme/tokens';

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

export function TabIcon({
    focused,
    Icon,
}: {
    focused: boolean;
    Icon: PhosphorIcon;
}) {
    return (
        <View style={containerBase}>
            <View
                style={[
                    indicatorBase,
                    { opacity: focused ? 1 : 0, transform: [{ scaleX: focused ? 1 : 0.3 }] },
                ]}
            />
            <View
                style={[
                    iconBoxBase,
                    {
                        backgroundColor: focused ? 'rgba(98, 189, 105, 0.22)' : 'transparent',
                        transform: [{ scale: focused ? 1.1 : 1 }],
                    },
                ]}
            >
                <Icon
                    size={24}
                    color={focused ? colors.cta.gradientEnd : colors.text.muted}
                    weight={focused ? 'fill' : 'regular'}
                />
            </View>
        </View>
    );
}
