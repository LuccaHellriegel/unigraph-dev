import { ChevronRight, ExpandLess, ExpandMore } from '@mui/icons-material';
import { Typography, FormControlLabel, Checkbox, Skeleton } from '@mui/material';
import React from 'react';
import ReactJson, { InteractionProps } from 'react-json-view';
import { unpad } from 'unigraph-dev-common/lib/utils/entityUtils';
import { UnigraphObject } from 'unigraph-dev-common/lib/utils/utils';

export function StringObjectViewer({ object }: { object: any }) {
    const finalObject = unpad(object);
    const [expanded, setExpanded] = React.useState(false);
    const name = window.unigraph.getNamespaceMap?.()?.[object?.type?.['unigraph.id']]?._name;

    return (
        <div style={{ width: '100%' }}>
            <span style={{ color: 'gray' }}>{name ? 'Type: ' : 'Uid: '}</span>
            {name || object.uid}
            <br />
            <div
                style={{
                    display: Object.keys(object).filter((x) => x.startsWith('_value')).length ? 'flex' : 'none',
                    marginLeft: '-4px',
                    marginTop: '2px',
                    marginBottom: '2px',
                    color: 'gray',
                }}
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? <ExpandLess /> : <ExpandMore />}
                <div>{expanded ? 'Hide' : 'Show'} raw JSON representation</div>
            </div>
            <div
                style={{
                    maxHeight: '160px',
                    width: '100%',
                    overflowX: 'auto',
                    borderRadius: '4px',
                    border: '1px solid lightgray',
                    display: expanded ? 'block' : 'none',
                }}
            >
                {!object._value ? (
                    new UnigraphObject({ ...object }).as('primitive')
                ) : (
                    <pre>{JSON.stringify(finalObject, null, 2)}</pre>
                )}
            </div>
        </div>
    );
}

export const BasicPersonView = ({ data }: any) => data['_value.%'];

export function DefaultSkeleton() {
    return (
        <div style={{ width: '100%' }}>
            <Skeleton /> <Skeleton /> <Skeleton />
        </div>
    );
}

const onPropertyEdit = (edit: InteractionProps, pad: boolean) => {
    // console.log(edit);
    let refUpdateHost: any = edit.existing_src;
    edit.namespace.forEach((el) => {
        if (typeof el === 'string') refUpdateHost = refUpdateHost[el];
        else {
            throw new Error("Doesn't support deletion");
        }
    });
    if (refUpdateHost?.uid && typeof edit.name === 'string') {
        const updater: any = {};
        updater[edit.name] = edit.new_value;
        window.unigraph.updateObject(refUpdateHost.uid, updater, true, pad);
    }
};

export function JsontreeObjectViewer({ object, options }: { object: any; options: ObjectViewOptions }) {
    const [showPadded, setShowPadded] = React.useState(false);
    const onedit = (props: InteractionProps) => onPropertyEdit(props, !showPadded);

    return (
        <div>
            <Typography variant="h5">Object View</Typography>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={showPadded}
                        onChange={() => setShowPadded(!showPadded)}
                        name="showPadded"
                        color="primary"
                    />
                }
                label="Show object as padded"
            />
            {JSON.stringify(options)}
            <ReactJson
                src={showPadded ? object : unpad(object)}
                onEdit={options.canEdit && showPadded ? onedit : false}
                onAdd={options.canEdit && showPadded ? onedit : false}
            />
        </div>
    );
}
