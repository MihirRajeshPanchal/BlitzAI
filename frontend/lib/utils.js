import {clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs) {
	return twMerge(clsx(inputs))
}

export async function manageMedia(
	files, options
) {
	if (files === undefined || !Array.isArray(files) || options === undefined || options === {}) {
		return Array(files.length).fill(false)
	}

	if (!(options.requestMethods) || !(options.keygenFn)) {
		return Array(files.length).fill(false)
	}

	let fileMethods;
	if (Array.isArray(options.requestMethods)) {
		if (options.requestMethods.length === 0) {
			return Array(files.length).fill(false)
		}
		if (options.requestMethods.length !== files.length) {
			fileMethods = Array(files.length).fill(options.requestMethods[0])
		} else {
			fileMethods = options.requestMethods
		}
	} else {
		fileMethods = Array(files.length).fill(options.requestMethods[0])
	}

	const objectKeys = files.map((fileObj, fileIdx) => {
		return (
			options.keygenFn(fileObj, fileIdx)
		)
	})

	const mediaResponses = await Promise.all(
		objectKeys.map(async (objectKey, keyIndex) => {
			const fileObj = files[keyIndex]
			const fileMethod = fileMethods[keyIndex]

			const apiResp = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/meta/presigned-url`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"auth-token": window.localStorage.getItem("auth-token")
					},
					body: JSON.stringify({
						objectKey: objectKey,
						requestMethod: fileMethod
					})
				}
			)

			if (apiResp.ok) {
				const {presignedUrl} = await apiResp.json()

				const s3Resp = await fetch(
					presignedUrl,
					{
						method: fileMethod,
						headers: {
							"Content-Type": fileObj.type
						},
						body: fileObj
					},
				)

				return s3Resp.ok;


			}

			return false
		})
	)

	return mediaResponses
}

export async function createProject({projectName, projectType}) {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"auth-token": localStorage.getItem("auth-token") || ""
			},
			body: JSON.stringify({
				name: projectName,
				type: projectType
			})
		}
	)

	if (response.ok) {
		const {project} = await response.json()
		return project._id
	}

	return null
}

export async function updateProject({id, inputType, input, outputType, output}) {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${id}`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"auth-token": localStorage.getItem("auth-token") || ""
			},
			body: JSON.stringify({
				inputType,
				input,
				outputType
			})
		}
	)

	return response.ok
}

export async function getProjects() {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects`,
		{
			method: "GET",
			headers: {
				"auth-token": localStorage.getItem("auth-token") || ""
			}
		}
	)

	if (response.ok) {
		const respData = await response.json()
		return respData.projects
	}

	return null
}

export async function getProjectById(id) {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_BACKEND_URL}/projects/${id}`,
		{
			method: "GET",
			headers: {
				"auth-token": localStorage.getItem("auth-token") || ""
			}
		}
	)

	if (response.ok) {
		const respData = await response.json()
		return respData.project
	}

	return null
}