export class VranConf {
    private static instance?: VranConf
    api_base: string
    private constructor({ api_base }: { api_base: string }) {
        this.api_base = api_base
    }

    static get() {
        if (VranConf.instance === undefined || VranConf.instance === null) {
            let base_url = process.env.VRAN_HOST
            if (base_url === undefined || base_url == null) {
                base_url = 'http://127.0.0.1:8000'
            }
            VranConf.instance = new VranConf({ api_base: base_url + '/vran/api' })
        }
        return VranConf.instance
    }
}
