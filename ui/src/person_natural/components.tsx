import { VranConf } from "../config";
import { RemoteDataTable } from "../table/components";
export function PersonTable(props: any) {
    const columns = [
        { id: "names_personal", title: "Personal Names" },
        { id: "names_family", title: "Family Names" },
        { id: "display_txt", title: "Display Text" }]
    return <RemoteDataTable base_url={VranConf.get().api_base + "/persons"} initialColumns={columns} />
}
