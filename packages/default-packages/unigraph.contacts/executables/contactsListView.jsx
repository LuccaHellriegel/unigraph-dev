const [contacts, setContacts] = React.useState([]);
const [newName, setNewName] = React.useState('');
const [newEmail, setNewEmail] = React.useState('');
const tabContext = React.useContext(TabContext);
React.useEffect(() => {
    const viewId = getRandomInt();

    tabContext.subscribeToType(
        '$/schema/contact',
        (kb) => {
            setContacts(kb);
        },
        viewId,
    );

    return function cleanup() {
        tabContext.unsubscribe(viewId);
    };
}, []);

return (
    <>
        <Typography variant="h5" sx={{ margin: '8px' }}>
            Contacts
        </Typography>
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <TextField
                style={{ marginRight: '1rem' }}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name"
            >
                Name
            </TextField>
            <TextField
                style={{ marginRight: '1rem' }}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email"
            >
                Email
            </TextField>
            <Button
                onClick={async () => {
                    const uids = await unigraph.addObject({ emails: [newEmail], name: newName }, '$/schema/contact');
                    unigraph.runExecutable('$/executable/migrate-person-to-contact', { uid: uids[0], email: newEmail });
                }}
            >
                Add Contact
            </Button>
        </div>

        <DynamicObjectListView items={contacts.map((el) => new UnigraphObject(el))} context={null} compact />
    </>
);
