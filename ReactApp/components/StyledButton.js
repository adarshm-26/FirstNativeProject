import React from 'react';
import { Button } from 'react-native-paper';
import theme from '../Theme';

export default StyledButton = (props) => {
  const { onPress, disabled, inner } = props;
  return (
  <Button
    style={{ 
      marginTop : 15, 
      width: 150, 
      alignSelf: 'center',
    }}
    mode='contained'
    theme={{ 
      roundness: 50,
      colors: {
        primary: theme.colors.accent
      }
    }}
    onPress={onPress}
    disabled={disabled}
  >
    {inner}
  </Button>
  );
}