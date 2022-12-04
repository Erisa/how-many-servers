export interface Env {
	DISCORD_APP_ID: string;
	DISCORD_SECRET: string;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {

		const url = new URL(request.url);
		const redirect = Response.redirect(`https://discord.com/oauth2/authorize?client_id=${env.DISCORD_APP_ID}&redirect_uri=https%3A%2F%2F${url.hostname}%2Fcallback&response_type=code&scope=guilds&prompt=none`, 302)

		if (url.pathname !== '/callback') {
			return redirect
		} else {
			const code = url.searchParams.get('code')
			if (!code) {
				return redirect
			} else {

				let data = new FormData();

				data.append('client_id', env.DISCORD_APP_ID)
				data.append('client_secret', env.DISCORD_SECRET)
				data.append('grant_type', 'authorization_code')
				data.append('code', code)
				data.append('redirect_uri', `https://${url.hostname}/callback`)

				const discordExchangeResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
					method: 'POST',
					body: data
				})

				if (discordExchangeResponse.status === 200) {

					const discordData: any = await discordExchangeResponse.json()

					const guildResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
						headers: {
							'Authorization': `Bearer ${discordData.access_token}`
						}
					})

					if (guildResponse.status == 200) {
						let guilds: any[] = await guildResponse.json()

						return new Response(`You are in ${guilds.length} servers!`)
					}

				} else {
					return redirect
				}
			}
		}
		return redirect
	},
};
