import React from "react";

export default function Modal({
	id,
	children,
	className,
	showCloseButton,
}: {
	id: string;
	children: React.ReactNode;
	className?: string;
	showCloseButton?: boolean;
}) {
	return (
		<dialog
			id={id}
			className="modal w-screen h-screen"
		>
			<div className={`modal-box ${className}`}>
				{children}
				{(showCloseButton === undefined || showCloseButton) && (
					<div className="modal-action">
						<form method="dialog">
							{/* if there is a button in form, it will close the modal */}
							<button className="btn">Close</button>
						</form>
					</div>
				)}
			</div>
			<form
				method="dialog"
				className="modal-backdrop"
			>
				<button>Close</button>
			</form>
		</dialog>
	);
}

export function showModal(id: string) {
	(document.getElementById(id) as HTMLDialogElement | undefined)?.showModal();
}

export function hideModal(id: string) {
	(document.getElementById(id) as HTMLDialogElement | undefined)?.close();
}
