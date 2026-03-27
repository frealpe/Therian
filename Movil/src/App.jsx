import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import ARWebSocketView from './views/ARWebSocketView';

const App = () => {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ARWebSocketView />
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
