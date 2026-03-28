import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Theme } from '../styles/Theme';

const GlassCard = ({ children, style, padding = Theme.spacing.md }) => {
    return (
        <View style={[styles.container, style]}>
            <BlurView intensity={20} tint="dark" style={[styles.blur, { padding }]}>
                <View style={styles.inner}>
                    {children}
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: Theme.borderRadius.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Theme.colors.glassBorder,
        backgroundColor: 'rgba(22, 26, 33, 0.4)',
    },
    blur: {
        width: '100%',
    },
    inner: {
        width: '100%',
    }
});

export default GlassCard;
