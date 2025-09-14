import { createContext, useContext, useState } from "react";

export enum ViewPage {
	Main = "main",
	Logs = "logs",
}

type PageCtx = {
	page: ViewPage;
	setPage: React.Dispatch<React.SetStateAction<ViewPage>>;
};

const PageCtx = createContext<PageCtx>({
	page: ViewPage.Main,
	setPage: () => {},
});

export function PageProvider(props: { children: React.ReactNode }) {
	const [page, setPage] = useState(ViewPage.Main);

	return (
		<PageCtx.Provider
			value={{
				page,
				setPage,
			}}
		>
			{props.children}
		</PageCtx.Provider>
	);
}

export function usePage() {
	return useContext(PageCtx);
}