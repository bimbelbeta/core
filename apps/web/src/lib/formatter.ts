export function formatRupiah(value: number | string) {
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	})
		.format(num)
		.replace("IDR", "Rp")
		.replace(/\s/g, "");
}

export function getInitials(name: string) {
	return name
		.split(" ")
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();
}
