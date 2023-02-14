type HeaderMenuProps = {
    removeColumnCallback: () => void
    closeHeaderMenuCallback: () => void
}
export function HeaderMenu(props: HeaderMenuProps) {
    return (
        <div className="vran-header-menu-container">
            <div className="vran-header-menu-close-row">
                <div onClick={props.closeHeaderMenuCallback}>✖</div>
            </div>
            <div
                className="vran-header-menu-item"
                onClick={() => {
                    props.removeColumnCallback()
                    props.closeHeaderMenuCallback()
                }}
            >
                <div className="danger">Hide Column</div>
            </div>
        </div>
    )
}
