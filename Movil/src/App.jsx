import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import Home from './views/Home';

const App = () => {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <Home />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
});

export default App;
