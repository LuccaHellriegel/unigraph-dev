import { Card, Typography } from '@mui/material';
import React from 'react';
import { getRandomInt, UnigraphObject } from 'unigraph-dev-common/lib/api/unigraph';
import { AutoDynamicViewDetailed } from '../components/ObjectView/AutoDynamicViewDetailed';
import { TabContext } from '../utils';

type HomeSection = {
    header: string;
    content: React.ReactElement<any>;
    condition: () => Promise<boolean>;
};

export function HomeSection({ data }: any) {
    const [shouldDisplay, setShouldDisplay] = React.useState(false);
    const [flushCondition, setFlushCondition] = React.useState(true);
    const tabContext = React.useContext(TabContext);

    React.useEffect(() => {
        const fn = (newId: string) => {
            if (newId === 'home') setFlushCondition(true);
        };

        window.unigraph.getState('global/activeTab').subscribe(fn);

        return () => {
            window.unigraph.getState('global/activeTab').unsubscribe(fn);
        };
    }, []);

    React.useEffect(() => {
        const shouldRender = () => {
            if (tabContext.isVisible()) {
                window.unigraph.runExecutable(data.get('condition')._value.uid, {}).then((ret: any) => {
                    if (ret === true) setShouldDisplay(true);
                    else setShouldDisplay(false);
                });
            }
        };
        const int = setInterval(shouldRender, 1000 * 60);
        if (flushCondition) {
            shouldRender();
            setFlushCondition(false);
        }

        return function cleanup() {
            clearInterval(int);
        };
    }, [flushCondition]);

    return shouldDisplay ? (
        <Card
            style={{ padding: '16px', margin: '12px' }}
            variant="outlined"
            onClick={() => {
                setTimeout(() => {
                    setFlushCondition(true);
                }, 500);
            }}
        >
            <Typography variant="h6" gutterBottom>
                {data.get('view/name').as('primitive')}
            </Typography>
            <AutoDynamicViewDetailed object={new UnigraphObject(data.get('view')._value)} />
        </Card>
    ) : (
        <span />
    );
}

export default function ExplorerHome({ id }: any) {
    const [sections, setSections] = React.useState<Partial<any>[]>([]);
    const tabContext = React.useContext(TabContext);
    React.useEffect(() => {
        const subsId = getRandomInt();

        tabContext.subscribeToType(
            '$/schema/home_section',
            (its: any[]) => {
                setSections(its);
            },
            subsId,
        );

        return function cleanup() {
            tabContext.unsubscribe(subsId);
        };
    }, []);

    return (
        <div>
            {sections.map((el) => (
                <HomeSection data={el} key={el.uid} />
            ))}
        </div>
    );
}
