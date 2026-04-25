import { oc as orpcContract } from "@orpc/contract";

export const oc = orpcContract.errors({
	NOT_FOUND: { message: "Gagal menemukan resource yang diminta." },
	UNAUTHORIZED: { message: "Anda tidak memiliki akses ke resource ini." },
	BAD_REQUEST: { message: "Gagal memproses permintaan anda." },
	UNPROCESSABLE_CONTENT: { message: "Permintaan anda tidak dapat diproses." },
	INTERNAL_SERVER_ERROR: { message: "Terjadi kesalahan pada sisi kami, silahkan coba lagi." },
	FORBIDDEN: { message: "Anda tidak memiliki hak akses ke resource ini." },
	TOO_MANY_REQUESTS: { message: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
});
