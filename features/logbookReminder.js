import schedule from 'node-schedule';

export default function logbookReminder(client, channelsConfig) {
  schedule.scheduleJob('55 23 * * *', async () => {
    const channelId = channelsConfig.logbookChannelId;
    if (!channelId) {
      console.error("logbookChannelId is not set in channels config");
      return;
    }

    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        console.error("Invalid channel ID or the channel is not text-based");
        return;
      }

      const guild = channel.guild;
      if (!guild) {
        console.error("The channel is not part of a guild");
        return;
      }

      // Get messages from the channel starting from today
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

      let fetchedMessages = [];
      let lastId;
      let continueFetching = true;

      while (continueFetching) {
        const options = { limit: 100 };
        if (lastId) options.before = lastId;

        const messages = await channel.messages.fetch(options);
        if (messages.size === 0) break;

        fetchedMessages.push(...messages.values());

        lastId = messages.last().id;

        if (messages.last().createdAt < startOfDay) break;
      }

      // Filter messages sent today
      const todayMessages = fetchedMessages.filter(msg => msg.createdAt >= startOfDay);

      // Set of user IDs who sent messages today
      const activeUserIds = new Set(todayMessages.map(msg => msg.author.id));

      // Fetch all guild members to have full cache
      await guild.members.fetch();

      // Filter human members who didn't send a message today
      const inactiveMembers = guild.members.cache.filter(member =>
        !member.user.bot && !activeUserIds.has(member.id)
      );

      // Build the mention string
      const mentions = inactiveMembers.map(member => `<@${member.id}>`).join(' ');

      const reminderMessage = `📔 What did you do today? Please share your log.` + 
        (mentions.length > 0 ? `\n\n🔔 Reminder for: ${mentions}` : '');

      await channel.send(reminderMessage);

    } catch (error) {
      console.error("Failed to send logbook reminder:", error);
    }
  });
}
