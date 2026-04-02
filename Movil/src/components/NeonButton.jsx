import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '../styles/Theme';

const NeonButton = ({ title, onPress, secondary, style }) => {
    const color = secondary ? Theme.colors.secondary : Theme.colors.primary;

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.button,
                {
                    borderColor: color,
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 10,
                    elevation: 5, // for Android
                },
                style
            ]}
        >
            <Text style={[styles.text, { color }]}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderWidth: 1.5,
        borderRadius: Theme.borderRadius.md,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    text: {
        fontFamily: Theme.fonts.headline,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        fontSize: 12,
    }
});

export default NeonButton;
