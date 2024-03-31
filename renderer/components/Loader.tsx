import { RingLoader } from 'react-spinners';

const loaderOverlayStyle = {
  position: 'fixed' as 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
};

const Loader = () => {
  return (
    <div style={loaderOverlayStyle}>
      <RingLoader
        //@ts-ignore
        css={{
          display: 'block',
          margin: '0 auto',
          borderColor: 'red',
        }}
        size={150}
        color={'#0000ff'}
        loading={true}
      />
    </div>
  );
};

export default Loader;
