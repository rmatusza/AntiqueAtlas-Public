export function Modal ({ children, background, dimensions, tailwindStyles = "", namedStyles = [], overwriteBaseStyle = false })
{
  const baseStyle = "flex flex-col p-8";
  const customStyle = tailwindStyles;
  const style = {
    backgroundImage: background ? `url(${background})` : '',
    backgroundSize: '800px 500px',
    backgroundRepeat: 'no-repeat',
    width: dimensions?.width || '800px',
    height: dimensions?.height || '500px',
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-[rgba(43,26,9,0.7)] flex items-center justify-center z-50">
      <div className={buildClassName(baseStyle, customStyle, namedStyles, overwriteBaseStyle)} style={style} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.getElementById("modal-root")
  )
}