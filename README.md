# CS2 Community Discord Bot

A full-featured Discord bot for CS2 communities with tickets, giveaways, moderation, and more.

## Quick Start

### 1. Install Dependencies
```bash
cd discord-bot
npm install
```

### 2. Configure Tokens
Open `config.js` and edit these lines:

```javascript
export const BOT_TOKEN = "YOUR_BOT_TOKEN_HERE";  // Discord bot token
export const CLIENT_ID = "YOUR_CLIENT_ID_HERE";  // Application client ID  
export const GUILD_ID = "YOUR_GUILD_ID_HERE";    // Your server ID (optional)
```

### 3. Deploy Commands
```bash
node deploy-commands.js
```

### 4. Start the Bot
```bash
node index.js
```

---

## Getting Your Tokens

### Bot Token
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it
3. Go to "Bot" section and click "Add Bot"
4. Enable these Privileged Gateway Intents:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent
5. Click "Reset Token" and copy it

### Client ID
1. In the Discord Developer Portal, go to "OAuth2" > "General"
2. Copy the "Client ID"

### Guild ID (Optional)
1. Enable Developer Mode in Discord (Settings > App Settings > Advanced)
2. Right-click your server and click "Copy Server ID"

---

## Features

### Ticket System
- Create support tickets with multiple categories
- Claim, close, reopen, and delete tickets
- Ticket transcripts
- Add/remove users from tickets

### Giveaway System
- Create timed giveaways
- Role requirements for entry
- Multiple winners support
- Reroll functionality

### Welcome System
- Welcome messages (embed or text)
- Auto-role on join
- DM welcome messages
- Leave messages

### Moderation
- Kick, ban, unban, timeout
- Warning system
- Purge messages
- Slowmode control
- Channel lock/unlock

### Admin Commands
- DM users as the bot
- Create announcements
- Send custom embeds
- Custom text commands
- Role management

### CS2 Integration
- Steam account linking
- Random map picker
- Random weapon loadout
- Team randomizer
- Crosshair generator
- Side (CT/T) coinflip
- Map veto system

### Utility Commands
- Ping/latency
- Server info
- User info
- Polls
- Reminders

---

## Configuration

Edit `config.json` to customize:

```json
{
  "prefix": "$",
  "tickets": {
    "categoryId": "YOUR_CATEGORY_ID",
    "supportRoleId": "YOUR_SUPPORT_ROLE_ID"
  },
  "welcome": {
    "channelId": "YOUR_WELCOME_CHANNEL_ID",
    "autoRoleId": "YOUR_AUTO_ROLE_ID"
  },
  "logging": {
    "channelId": "YOUR_LOG_CHANNEL_ID"
  }
}
```

---

## Commands

| Command | Description |
|---------|-------------|
| `/ticket panel` | Create a ticket panel |
| `/giveaway start` | Start a new giveaway |
| `/mod kick/ban/timeout` | Moderation actions |
| `/mod warn/warnings` | Warning system |
| `/admin dm` | DM a user |
| `/admin announce` | Send announcements |
| `/cs2 link/profile` | Steam account linking |
| `/cs2 map/weapon/team` | CS2 utilities |
| `/utility ping/serverinfo` | Server utilities |
| `/utility poll/remind` | Polls and reminders |

---

## Inviting the Bot

Use this URL (replace YOUR_CLIENT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

---

## Data Storage

Data is saved to JSON files in the `data/` folder:
- Auto-saves every 5 minutes
- Saves on graceful shutdown (Ctrl+C)

---

## Troubleshooting

### "Cannot find module 'discord.js'"
Run `npm install` first.

### "Invalid token"
Make sure you copied the entire bot token correctly in `config.js`.

### Commands not appearing
1. Run `node deploy-commands.js`
2. Wait a few minutes for global commands, or use Guild ID for instant updates

### Bot is offline
Check the console for error messages. Make sure all intents are enabled in the Developer Portal.
