;async () => {
    try {
        const dotenv = await import('dotenv')
        dotenv.config()
    } catch (err) {
        console.log(err)
    }
}

export class VranConf {
    private static instance?: VranConf
    api_base: string
    private constructor({ api_base }: { api_base: string }) {
        this.api_base = api_base
    }

    static get() {
        if (VranConf.instance === undefined || VranConf.instance === null) {
            let api_path = process.env.VRAN_API_PATH
            if (api_path === undefined || api_path == null) {
                api_path = '/api'
            }
            VranConf.instance = new VranConf({ api_base: api_path })
        }
        return VranConf.instance
    }
}
