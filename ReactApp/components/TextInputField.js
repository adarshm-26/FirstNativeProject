import React from 'react';
import { TextInput } from 'react-native-paper';

export default TextInputField = (props) => {
  return (<TextInput
    style={{ padding: 5 }}
    mode='outlined'
    {...props}
  />);
};