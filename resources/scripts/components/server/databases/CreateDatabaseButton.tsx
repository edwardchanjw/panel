import React, { useState } from 'react';
import Modal from '@/components/elements/Modal';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { object, string } from 'yup';
import createServerDatabase from '@/api/server/createServerDatabase';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import Button from '@/components/elements/Button';
import tw from 'twin.macro';

interface Values {
    databaseName: string;
    connectionsFrom: string;
}

const schema = object().shape({
    databaseName: string()
        .required('A database name must be provided.')
        .min(5, 'Database name must be at least 5 characters.')
        .max(64, 'Database name must not exceed 64 characters.')
        .matches(/^[A-Za-z0-9_\-.]{5,64}$/, 'Database name should only contain alphanumeric characters, underscores, dashes, and/or periods.'),
    connectionsFrom: string()
        .required('A connection value must be provided.')
        .matches(/^([1-9]{1,3}|%)(\.([0-9]{1,3}|%))?(\.([0-9]{1,3}|%))?(\.([0-9]{1,3}|%))?$/, 'A valid connection address must be provided.'),
});

export default () => {
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const { addError, clearFlashes } = useFlash();
    const [ visible, setVisible ] = useState(false);

    const appendDatabase = ServerContext.useStoreActions(actions => actions.databases.appendDatabase);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('database:create');
        createServerDatabase(uuid, { ...values })
            .then(database => {
                appendDatabase(database);
                setVisible(false);
            })
            .catch(error => {
                console.log(error);
                addError({ key: 'database:create', message: httpErrorToHuman(error) });
                setSubmitting(false);
            });
    };

    return (
        <>
            <Formik
                onSubmit={submit}
                initialValues={{ databaseName: '', connectionsFrom: '%' }}
                validationSchema={schema}
            >
                {
                    ({ isSubmitting, resetForm }) => (
                        <Modal
                            visible={visible}
                            dismissable={!isSubmitting}
                            showSpinnerOverlay={isSubmitting}
                            onDismissed={() => {
                                resetForm();
                                setVisible(false);
                            }}
                        >
                            <FlashMessageRender byKey={'database:create'} css={tw`mb-6`}/>
                            <h2 css={tw`text-2xl mb-6`}>Create new database</h2>
                            <Form css={tw`m-0`}>
                                <Field
                                    type={'string'}
                                    id={'database_name'}
                                    name={'databaseName'}
                                    label={'Database Name'}
                                    description={'A descriptive name for your database instance.'}
                                />
                                <div css={tw`mt-6`}>
                                    <Field
                                        type={'string'}
                                        id={'connections_from'}
                                        name={'connectionsFrom'}
                                        label={'Connections From'}
                                        description={'Where connections should be allowed from. Use % for wildcards.'}
                                    />
                                </div>
                                <div css={tw`mt-6 text-right`}>
                                    <Button
                                        type={'button'}
                                        isSecondary
                                        css={tw`mr-2`}
                                        onClick={() => setVisible(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type={'submit'}>
                                        Create Database
                                    </Button>
                                </div>
                            </Form>
                        </Modal>
                    )
                }
            </Formik>
            <Button onClick={() => setVisible(true)}>
                New Database
            </Button>
        </>
    );
};
