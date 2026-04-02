import React from 'react';
import {
    useFonts,
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold
} from '@expo-google-fonts/space-grotesk';
import {
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold
} from '@expo-google-fonts/manrope';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Theme } from '../styles/Theme';

const FontLoader = ({ children }) => {
    const [fontsLoaded] = useFonts({
        SpaceGrotesk_300Light,
        SpaceGrotesk_400Regular,
        SpaceGrotesk_500Medium,
        SpaceGrotesk_600SemiBold,
        SpaceGrotesk_700Bold,
        Manrope_300Light,
        Manrope_400Regular,
        Manrope_500Medium,
        Manrope_600SemiBold,
        Manrope_700Bold,
    });

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
            </View>
        );
    }

    return children;
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        backgroundColor: Theme.colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export default FontLoader;
