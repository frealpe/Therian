import { Alert } from 'react-native';

const useApp = () => {
  const ToastMsg = (msg) => {
    // In React Native, we can use Alert or a Toast library
    Alert.alert('Info', msg);
  };

  const ToastMsgError = (msg) => {
    Alert.alert('Error', msg);
  };

  const ToastMsgSuccess = (msg) => {
    Alert.alert('Success', msg);
  };

  return {
    ToastMsg,
    ToastMsgError,
    ToastMsgSuccess,
  };
};

export default useApp;
