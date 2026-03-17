/**
 * SectionHeader — padrão de cabeçalho de seção do design system.
 * Barra vertical de destaque (âmbar) à esquerda do título; opcional pill à direita.
 */

import { View, Text } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { ds } from '@/theme/ds';

export interface SectionHeaderProps {
    title: string;
    /** Conteúdo à direita (ex.: "0/3 completas") */
    right?: React.ReactNode;
}

export function SectionHeader({ title, right }: SectionHeaderProps) {
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: ds.space.sm,
            }}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: ds.space.sm }}>
                <View
                    style={{
                        width: 4,
                        height: 20,
                        borderRadius: 2,
                        backgroundColor: ds.colors.sectionAccent,
                    }}
                />
                <Text style={ds.typography.sectionTitle}>{title}</Text>
            </View>
            {right != null && <View>{right}</View>}
        </View>
    );
}

/** Pill de progresso (ex.: "0/3 completas" / "3/3 completas") */
export function SectionPill({
    current,
    total,
    complete,
}: {
    current: number;
    total: number;
    complete: boolean;
}) {
    const textColor = complete ? ds.colors.pillCompleteText : ds.colors.pillIncompleteText;
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                borderRadius: ds.radius.full,
                paddingHorizontal: ds.space.sm,
                paddingVertical: ds.space.xs,
                backgroundColor: complete ? ds.colors.pillComplete : ds.colors.pillIncomplete,
            }}
        >
            {complete && <Sparkles size={12} color={textColor} />}
            <Text style={[ds.typography.pill, { color: textColor }]}>
                {current}/{total} completas
            </Text>
        </View>
    );
}
