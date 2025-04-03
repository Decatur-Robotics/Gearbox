import { useState } from "react";
import Card from "./Card";
import ClientApi from "@/lib/api/ClientApi";
import Avatar from "./Avatar";
import Image from "next/image";
import { Session } from "inspector/promises";
import toast from "react-hot-toast";

const api = new ClientApi();
export default function EditAvatarModal(props: {
	currentImg: string;
	close: () => void;
}) {
	const [newAvatar, setNewAvatar] = useState<string>(props.currentImg);

	async function updateAvatar() {
		toast.promise(
			api.changePFP(newAvatar).then(() => location.reload()),
			{ loading: "Updating profile picture...", success: "Successfully updated profile picture!", error: "Failed to update profile picture!" },
		);
	}

	return (
		<dialog
			open={true}
			className="modal"
		>
			<Card
				title="Edit Avatar"
				coloredTop="bg-secondary"
			>
				<div className="my-9 flex justify-center w-full">
					<Avatar
						user={{ image: newAvatar }}
						scale="scale-150"
					/>
				</div>

				<input
					defaultValue={props.currentImg}
					className="input"
					onChange={(e) => setNewAvatar(e.target.value)}
				/>
				<div className="flex gap-2 justify-start w-full">
					<button
						className="btn btn-primary mt-2"
						onClick={updateAvatar}
					>
						Save
					</button>
					<button
						className="btn btn-accent mt-2"
						onClick={props.close}
					>
						Cancel
					</button>
				</div>
			</Card>
		</dialog>
	);
}
