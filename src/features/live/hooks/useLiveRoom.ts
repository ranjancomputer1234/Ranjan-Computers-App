import {useRef, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useRepositories} from '../../../core/di';
import {queryKeys} from '../../../core/query';
import {accountKey, useSessionStore} from '../../../core/session';
import {appConfig} from '../../../core/config';

export function useLiveRoom(liveClassId: string) {
  const repos = useRepositories();
  const client = useQueryClient();
  const authenticated = useSessionStore(s => s.status === 'authenticated');
  const chatKey = ['chat', accountKey(), liveClassId];
  const outgoing = useRef<{body: string; id: string} | null>(null);
  const [message, setMessage] = useState('');
  const [raised, setRaised] = useState(false);
  const cls = useQuery({queryKey: queryKeys.liveClass(liveClassId), queryFn: () => repos.live.get(liveClassId)});
  const join = useQuery({queryKey: ['join', accountKey(), liveClassId], queryFn: () => repos.live.join(liveClassId), enabled: authenticated && Boolean(cls.data && ['live', 'starting', 'ended'].includes(cls.data.status)), staleTime: 0});
  const chatAvailable = authenticated && appConfig.capabilities.liveChat && Boolean(join.data?.chatAvailable);
  const chat = useQuery({queryKey: chatKey, queryFn: () => repos.live.chatHistory(liveClassId), enabled: chatAvailable, refetchInterval: chatAvailable ? 5000 : false});
  const send = useMutation({
    mutationFn: () => {
      const body = message.trim();
      if (!chatAvailable || !body) throw new Error('Enter a message to send.');
      if (outgoing.current?.body !== body) outgoing.current = {body, id: `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`};
      return repos.live.sendChat(liveClassId, body, outgoing.current.id);
    },
    onSuccess: async () => { outgoing.current = null; setMessage(''); await client.invalidateQueries({queryKey: chatKey}); },
  });
  const hand = useMutation({
    mutationFn: () => repos.live.setHand(liveClassId, !raised),
    onSuccess: r => setRaised(r.raised),
  });
  return {cls, join, chat, send, hand, message, setMessage, raised, authenticated, chatAvailable};
}
