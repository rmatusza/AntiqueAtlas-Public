export function PopupMessage ({ background, lines, closePopup })
{
  return (
    <Modal background={background}>
      <div className="flex flex-col h-full">
        <div className='rounded-xl bg-black/50 mb-5'>
          {
            lines.map((line, i) => {
              return (
                <>
                  <p key={i} className={`${S.text.headingTextYellow} text-center`}>{line}</p>
                  <br></br>
                </>
              )
            })
          }
        </div>
        <div className="mt-auto">
          <Button type={"Close"} name={"Close"} callBack={closePopup} namedStyles={[S.button.redAndYellowButtonSingle, S.border.goldYellowBorder]} />
        </div>
      </div>
    </Modal>
  )
}