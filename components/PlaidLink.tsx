import React, { useCallback, useEffect, useState } from 'react'
import { Button } from './ui/button'
import { PlaidLinkOnSuccess, PlaidLinkOptions, usePlaidLink } from 'react-plaid-link'
import { useRouter } from 'next/navigation'
import { createLinkToken, exchangePublicToken } from '@/lib/actions/user.actions'

const PlaidLink = ({ user, variant }: PlaidLinkProps) => {
    const router = useRouter();
    const [token, setToken] = useState('');
    const [linkStatus, setLinkStatus] = useState<'idle' | 'loading' | 'linking' | 'success' | 'error'>('idle');

    useEffect(() => {
        const getLinkToken = async () => {
            setLinkStatus('loading');
            const data = await createLinkToken(user);
            setToken(data?.linkToken);
            setLinkStatus('idle');
        }
        getLinkToken();
    }, [user]);

    const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token: string) => {
        setLinkStatus('linking');
        try {
            await exchangePublicToken({
                publicToken: public_token,
                user,
            });
            setLinkStatus('success');
            router.push('/');
        } catch (error) {
            setLinkStatus('error');
            console.error('Bank linking failed:', error);
        }
    }, [user, router]);

    const config: PlaidLinkOptions = {
        token,
        onSuccess,
        onExit: () => setLinkStatus('idle')
    };

    const { open, ready } = usePlaidLink(config);

    const buttonText: Record<typeof linkStatus, string> = {
        idle: 'Link Account',
        loading: 'Preparing...',
        linking: 'Connecting...',
        success: 'Connected!',
        error: 'Try Again'
    };

    return (
        <Button
            onClick={() => open()}
            disabled={!ready || linkStatus === 'linking'}
            className={`plaidlink-${variant} ${linkStatus === 'success' ? 'bg-green-500' : ''}`}
        >
            {buttonText[linkStatus]}
        </Button>
    );
};
export default PlaidLink;
